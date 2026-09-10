import path from 'path';
import { Dataset } from '../models/dataset.model.js';
import { parseAndValidateFile } from '../utils/fileParser.js';

/**
 * Handles File Upload, Validation, Parsing, and Database Storage
 * POST /api/upload
 */
export const uploadDataset = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No File Uploaded',
        message: 'Please attach a .csv, .xlsx, or .xls file to upload.',
      });
    }

    const { originalname, buffer, size } = req.file;
    const ext = path.extname(originalname).toLowerCase().replace('.', '');
    const cleanFileName = path.basename(originalname);

    // Parse and validate the file buffer in memory
    const parsedResult = await parseAndValidateFile(buffer, originalname);

    // Create and save the new Dataset document
    const newDataset = new Dataset({
      userId: req.user.uid,
      fileName: cleanFileName,
      fileSize: size,
      fileType: ext,
      rowCount: parsedResult.rowCount,
      columnCount: parsedResult.columnCount,
      columns: parsedResult.columns,
      data: parsedResult.data,
      status: 'ready',
    });

    const savedDataset = await newDataset.save();

    return res.status(201).json({
      success: true,
      message: 'Dataset uploaded, parsed, and stored successfully.',
      dataset: {
        _id: savedDataset._id,
        fileName: savedDataset.fileName,
        fileSize: savedDataset.fileSize,
        fileType: savedDataset.fileType,
        rowCount: savedDataset.rowCount,
        columnCount: savedDataset.columnCount,
        columns: savedDataset.columns,
        createdAt: savedDataset.createdAt,
        preview: parsedResult.preview,
      },
    });
  } catch (error) {
    console.error('[Upload Controller Error]', error);
    return res.status(400).json({
      error: 'Upload Failed',
      message: error.message || 'An error occurred while parsing and processing the file.',
    });
  }
};

/**
 * Retrieves all datasets uploaded by the authenticated user
 * GET /api/datasets
 */
export const getUserDatasets = async (req, res, next) => {
  try {
    const userIdentifiers = [req.user.uid, req.user.email].filter(Boolean);

    // Lean query excluding the raw data array for fast listing performance
    const datasets = await Dataset.find({ userId: { $in: userIdentifiers } })
      .select('-data')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: datasets.length,
      datasets,
    });
  } catch (error) {
    console.error('[Get Datasets Error]', error);
    next(error);
  }
};

/**
 * Retrieves full details and preview rows of a specific dataset with ownership verification
 * GET /api/datasets/:id
 */
export const getDatasetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userIdentifiers = [req.user.uid, req.user.email].filter(Boolean);

    const dataset = await Dataset.findById(id);

    if (!dataset) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Dataset not found.',
      });
    }

    // Strict ownership verification
    if (!userIdentifiers.includes(dataset.userId)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this dataset.',
      });
    }

    // Provide preview (first 50 rows) and total structure
    const preview = dataset.data ? dataset.data.slice(0, 50) : [];

    return res.status(200).json({
      success: true,
      dataset: {
        _id: dataset._id,
        fileName: dataset.fileName,
        fileSize: dataset.fileSize,
        fileType: dataset.fileType,
        rowCount: dataset.rowCount,
        columnCount: dataset.columnCount,
        columns: dataset.columns,
        status: dataset.status,
        createdAt: dataset.createdAt,
        updatedAt: dataset.updatedAt,
        preview,
      },
    });
  } catch (error) {
    console.error('[Get Dataset By Id Error]', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Invalid dataset identifier format.',
      });
    }
    next(error);
  }
};

/**
 * Deletes a dataset with ownership verification
 * DELETE /api/datasets/:id
 */
export const deleteDataset = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userIdentifiers = [req.user.uid, req.user.email].filter(Boolean);

    const dataset = await Dataset.findById(id);

    if (!dataset) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Dataset not found.',
      });
    }

    // Strict ownership verification
    if (!userIdentifiers.includes(dataset.userId)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to delete this dataset.',
      });
    }

    await Dataset.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Dataset deleted successfully.',
    });
  } catch (error) {
    console.error('[Delete Dataset Error]', error);
    if (error.name === 'CastError') {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Invalid dataset identifier format.',
      });
    }
    next(error);
  }
};
