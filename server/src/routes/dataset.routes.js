import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyAuth } from '../middleware/auth.middleware.js';
import { upload, handleMulterError } from '../middleware/upload.middleware.js';
import {
  uploadDataset,
  getUserDatasets,
  getDatasetById,
  deleteDataset,
} from '../controllers/dataset.controller.js';

const router = Router();

// Rate limiter for upload endpoint: max 10 uploads per 15 minutes per user/IP
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP / user to 10 upload requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Upload limit reached (10 uploads per 15 minutes). Please try again later.',
  },
  keyGenerator: (req) => {
    return req.user?.uid || req.ip || 'anonymous-uploader';
  },
});

// All dataset routes require authentication
router.use(verifyAuth);

/**
 * @route   POST /api/upload
 * @desc    Upload, validate, parse, and store dataset
 * @access  Private
 */
router.post(
  '/upload',
  uploadLimiter,
  upload.single('file'),
  handleMulterError,
  uploadDataset
);

/**
 * @route   GET /api/datasets
 * @desc    List all datasets belonging to authenticated user
 * @access  Private
 */
router.get('/datasets', getUserDatasets);

/**
 * @route   GET /api/datasets/:id
 * @desc    Get details and preview of a specific dataset
 * @access  Private
 */
router.get('/datasets/:id', getDatasetById);

/**
 * @route   DELETE /api/datasets/:id
 * @desc    Delete a specific dataset
 * @access  Private
 */
router.delete('/datasets/:id', deleteDataset);

export default router;
