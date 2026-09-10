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
import { getDatasetCharts } from '../controllers/chart.controller.js';
import { getDatasetAnalysis } from '../controllers/analysis.controller.js';
import { getDatasetInsights } from '../controllers/insights.controller.js';

const router = Router();

// Rate limiter for upload endpoint: max 10 uploads per 15 minutes per user/IP
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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

// Rate limiter for chart calculations: max 60 chart requests per 15 minutes per user
const chartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Chart request limit reached. Please wait a moment before requesting more charts.',
  },
  keyGenerator: (req) => {
    return req.user?.uid || req.ip || 'anonymous-charter';
  },
});

// Rate limiter for Python analysis requests: max 60 requests per 15 minutes per user
const analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'Analysis request limit reached. Please wait a moment before requesting more dataset analysis.',
  },
  keyGenerator: (req) => {
    return req.user?.uid || req.ip || 'anonymous-analyzer';
  },
});

// Rate limiter for AI Insights: max 15 requests per 1 hour per user (cost protection)
const insightLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: "You've reached the insight refresh limit (15 per hour). Please try again in a bit.",
  },
  keyGenerator: (req) => {
    return req.user?.uid || req.ip || 'anonymous-insight-requester';
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
 * @route   GET /api/datasets/:id/charts
 * @desc    Generate or fetch cached auto-charts and KPIs for a dataset
 * @access  Private
 */
router.get('/datasets/:id/charts', chartLimiter, getDatasetCharts);

/**
 * @route   GET /api/datasets/:id/analysis
 * @desc    Get deep statistical analysis (trends, top/bottom, outliers, correlations) from Python microservice
 * @access  Private
 */
router.get('/datasets/:id/analysis', analysisLimiter, getDatasetAnalysis);

/**
 * @route   GET /api/datasets/:id/insights
 * @desc    Get plain-English AI explanations powered by LLM API (Phase 5)
 * @access  Private
 */
router.get('/datasets/:id/insights', insightLimiter, getDatasetInsights);

/**
 * @route   DELETE /api/datasets/:id
 * @desc    Delete a specific dataset
 * @access  Private
 */
router.delete('/datasets/:id', deleteDataset);

export default router;
