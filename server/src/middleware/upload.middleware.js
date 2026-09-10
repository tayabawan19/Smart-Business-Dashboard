import multer from 'multer';
import path from 'path';

// Max file size in bytes (Default: 10MB)
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

// Use memory storage for security — process buffer in-memory and discard
const storage = multer.memoryStorage();

// File filter: accept only .csv, .xlsx, .xls
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();

  const allowedMimeTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/csv',
    'application/x-csv',
    'text/x-csv',
    'text/comma-separated-values',
    'application/octet-stream',
  ];

  if (!allowedExtensions.includes(ext)) {
    return cb(
      new Error(
        `Invalid file type "${ext}". Only .csv, .xlsx, and .xls files are supported.`
      ),
      false
    );
  }

  // Accept file buffer
  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only 1 file per upload request
  },
  fileFilter,
});

/**
 * Custom Multer error wrapper middleware
 */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File Too Large',
        message: `File size exceeds the maximum limit of ${MAX_FILE_SIZE_MB}MB.`,
      });
    }
    return res.status(400).json({
      error: 'Upload Error',
      message: err.message,
    });
  } else if (err) {
    return res.status(400).json({
      error: 'Invalid File',
      message: err.message || 'Error occurred while processing file upload.',
    });
  }
  next();
};
