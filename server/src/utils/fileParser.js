import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import path from 'path';

const MAX_ROW_LIMIT = parseInt(process.env.MAX_ROW_LIMIT || '50000', 10);

/**
 * Validates file signature / magic bytes against declared file type.
 */
export const validateFileSignature = (buffer, extension) => {
  if (!buffer || buffer.length === 0) {
    throw new Error('The uploaded file is empty.');
  }

  const ext = extension.toLowerCase();

  // Check binary signatures
  if (ext === '.xlsx') {
    // ZIP header: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    const isZip =
      buffer[0] === 0x50 &&
      buffer[1] === 0x4b &&
      (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
      (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08);
    if (!isZip) {
      throw new Error('Invalid Excel (.xlsx) file signature. The file appears to be corrupted or not a valid spreadsheet.');
    }
  } else if (ext === '.xls') {
    // Compound File Binary Format: 0xD0 0xCF 0x11 0xE0
    const isCfb =
      buffer[0] === 0xd0 &&
      buffer[1] === 0xcf &&
      buffer[2] === 0x11 &&
      buffer[3] === 0xe0;
    if (!isCfb) {
      throw new Error('Invalid Excel (.xls) file signature.');
    }
  } else if (ext === '.csv') {
    // CSV files are plain text. Ensure no binary executable headers (like MZ / ELF).
    const isExecutable =
      (buffer[0] === 0x4d && buffer[1] === 0x5a) || // MZ (Windows EXE/DLL)
      (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46); // ELF (Linux binary)
    if (isExecutable) {
      throw new Error('Executable files are strictly rejected.');
    }
  }
};

/**
 * Sanitizes header names to prevent prototype pollution and illegal property names.
 */
export const sanitizeHeaderName = (header, index) => {
  if (header === null || header === undefined) {
    return `Column_${index + 1}`;
  }

  let sanitized = String(header).trim();

  // Strip formula injection characters if present in header
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = sanitized.replace(/^[=+\-@\t\r]+/, '');
  }

  // Remove control characters and quotes
  sanitized = sanitized.replace(/[\x00-\x1F\x7F"'`]/g, '').trim();

  // Prevent prototype pollution keywords
  const forbidden = ['__proto__', 'constructor', 'prototype', '$where', '$gt', '$lt', '$ne', '$in'];
  if (forbidden.includes(sanitized.toLowerCase()) || sanitized.startsWith('$')) {
    sanitized = `col_${sanitized}`;
  }

  return sanitized || `Column_${index + 1}`;
};

/**
 * Strips formula injection characters from cell strings.
 * Prevents CSV/Excel formula execution (DDE / Command Execution / =SUM / +cmd).
 */
export const sanitizeCellValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  let str = String(value).trim();

  // Check for formula injection triggers: =, +, -, @, tab, carriage return
  if (/^[=+\-@\t\r]/.test(str)) {
    // Prefix with single quote or strip dangerous formula prefix to neutralize
    str = "'" + str;
  }

  // Remove null bytes
  str = str.replace(/\0/g, '');

  return str;
};

/**
 * Detects whether a string or value represents a Date.
 */
const isDateString = (val) => {
  if (!val || typeof val !== 'string') return false;
  if (val.length < 6 || val.length > 35) return false;
  // If it's pure digits, consider it a number or ID, not a date
  if (/^\d+$/.test(val)) return false;

  const datePatterns = [
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/, // YYYY-MM-DD or YYYY/MM/DD
    /^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}/, // DD-MM-YYYY or MM/DD/YYYY
    /^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}/, // Jan 1, 2024
  ];

  if (datePatterns.some((pattern) => pattern.test(val))) {
    const parsed = Date.parse(val);
    return !isNaN(parsed);
  }
  return false;
};

/**
 * Automatically detects column data types by analyzing sample values.
 * Returns 'number', 'date', or 'text'.
 */
export const detectColumnTypes = (headers, rows) => {
  const sampleLimit = Math.min(rows.length, 100);
  const sampleRows = rows.slice(0, sampleLimit);

  return headers.map((header) => {
    let numberCount = 0;
    let dateCount = 0;
    let textCount = 0;
    let nonEmptyCount = 0;
    const sampleValues = [];

    for (const row of sampleRows) {
      const val = row[header];
      if (val !== undefined && val !== null && val !== '') {
        nonEmptyCount++;
        if (sampleValues.length < 5) {
          sampleValues.push(String(val).slice(0, 50));
        }

        if (typeof val === 'number') {
          numberCount++;
        } else if (typeof val === 'string') {
          const cleanVal = val.startsWith("'") ? val.slice(1) : val;
          if (!isNaN(Number(cleanVal)) && cleanVal.trim() !== '') {
            numberCount++;
          } else if (isDateString(cleanVal)) {
            dateCount++;
          } else {
            textCount++;
          }
        }
      }
    }

    let detectedType = 'text';
    if (nonEmptyCount > 0) {
      if (numberCount / nonEmptyCount >= 0.75) {
        detectedType = 'number';
      } else if (dateCount / nonEmptyCount >= 0.75) {
        detectedType = 'date';
      }
    }

    return {
      name: header,
      type: detectedType,
      sampleValues,
    };
  });
};

/**
 * Parses and validates CSV/Excel files from buffer.
 */
export const parseAndValidateFile = async (buffer, originalName) => {
  const ext = path.extname(originalName).toLowerCase();

  // 1. Validate magic bytes / file signature
  validateFileSignature(buffer, ext);

  let rawHeaders = [];
  let rawRows = [];

  if (ext === '.csv') {
    // Parse CSV with PapaParse
    const csvString = buffer.toString('utf8');
    const parsed = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true,
      transformHeader: (h, idx) => sanitizeHeaderName(h, idx),
    });

    if (parsed.errors && parsed.errors.length > 0) {
      const fatalErrors = parsed.errors.filter((e) => e.type === 'Quotes' || e.code === 'UndetectableDelimiter');
      if (fatalErrors.length > 0) {
        throw new Error(`CSV parsing error: ${fatalErrors[0].message}`);
      }
    }

    rawHeaders = parsed.meta.fields || [];
    rawRows = parsed.data || [];
  } else if (ext === '.xlsx' || ext === '.xls') {
    // Parse Excel with XLSX (SheetJS)
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellFormula: false, // DO NOT parse formulas — treats cells as plain values
      cellHTML: false,
      raw: true,
    });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('The Excel workbook contains no visible worksheets.');
    }

    // Read first active worksheet
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert sheet to json array of objects
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Get raw rows array first to sanitize headers
      defval: '',
      blankrows: false,
    });

    if (!jsonData || jsonData.length === 0) {
      throw new Error('The Excel worksheet is empty.');
    }

    const headerRow = jsonData[0];
    rawHeaders = headerRow.map((h, idx) => sanitizeHeaderName(h, idx));

    // Map remaining rows into objects
    rawRows = jsonData.slice(1).map((row) => {
      const rowObj = {};
      rawHeaders.forEach((header, idx) => {
        rowObj[header] = row[idx] !== undefined ? row[idx] : '';
      });
      return rowObj;
    });
  } else {
    throw new Error(`Unsupported file extension: ${ext}`);
  }

  // 2. Validate Row & Header Structure
  // Filter out any completely empty headers or deduplicate headers
  const uniqueHeaders = [];
  const headerCountMap = {};

  rawHeaders.forEach((h, idx) => {
    let base = h || `Column_${idx + 1}`;
    if (headerCountMap[base]) {
      headerCountMap[base]++;
      uniqueHeaders.push(`${base}_${headerCountMap[base]}`);
    } else {
      headerCountMap[base] = 1;
      uniqueHeaders.push(base);
    }
  });

  if (uniqueHeaders.length === 0) {
    throw new Error('No valid column headers were detected in the file.');
  }

  // Filter out completely empty rows
  const cleanRows = rawRows.filter((row) => {
    if (!row || typeof row !== 'object') return false;
    return Object.values(row).some((val) => val !== null && val !== undefined && String(val).trim() !== '');
  });

  if (cleanRows.length === 0) {
    throw new Error('The file contains headers but has no data rows. At least 1 data row is required.');
  }

  if (cleanRows.length > MAX_ROW_LIMIT) {
    throw new Error(
      `File row count (${cleanRows.length.toLocaleString()}) exceeds the maximum allowed limit of ${MAX_ROW_LIMIT.toLocaleString()} rows.`
    );
  }

  // 3. Sanitize all cell data against Formula Injection & NoSQL Injection
  const sanitizedRows = cleanRows.map((row) => {
    const cleanRow = {};
    uniqueHeaders.forEach((header, idx) => {
      const origHeader = rawHeaders[idx] || header;
      const rawVal = row[origHeader] !== undefined ? row[origHeader] : row[header];
      cleanRow[header] = sanitizeCellValue(rawVal);
    });
    return cleanRow;
  });

  // 4. Detect column data types for metadata & future charting
  const columnMetadata = detectColumnTypes(uniqueHeaders, sanitizedRows);

  return {
    headers: uniqueHeaders,
    rowCount: sanitizedRows.length,
    columnCount: uniqueHeaders.length,
    columns: columnMetadata,
    data: sanitizedRows,
    preview: sanitizedRows.slice(0, 20),
  };
};
