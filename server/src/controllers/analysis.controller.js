import mongoose from 'mongoose';
import { Dataset } from '../models/dataset.model.js';

const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://localhost:8000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'sbd_internal_secure_key_2026';
const TIMEOUT_MS = 15000;

/**
 * Controller to fetch or compute deep statistical analysis via Python microservice
 * GET /api/datasets/:id/analysis
 */
export const getDatasetAnalysis = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user?.uid;

  console.log(`\n========================================`);
  console.log(`[Analysis Controller] Request received for datasetId: ${id}`);
  console.log(`[Analysis Controller] Authenticated userId: ${userId}`);

  // 1. Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.warn(`[Analysis Controller] Invalid ObjectId format: "${id}"`);
    return res.status(400).json({
      error: 'Invalid ID',
      message: 'Invalid dataset identifier format.',
    });
  }

  try {
    // 2. Fetch dataset from MongoDB
    const dataset = await Dataset.findById(id);

    if (!dataset) {
      console.warn(`[Analysis Controller] Dataset NOT found in MongoDB for id: ${id}`);
      return res.status(404).json({
        error: 'Not Found',
        message: 'Dataset not found.',
      });
    }

    // 3. Ownership check
    const userIdentifiers = [req.user?.uid, req.user?.email].filter(Boolean);
    if (!userIdentifiers.includes(dataset.userId)) {
      console.warn(`[Analysis Controller] Ownership mismatch: dataset.userId (${dataset.userId}) not in [${userIdentifiers.join(', ')}]`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view analysis for this dataset.',
      });
    }

    // 4. Return cached analysis if available
    if (dataset.analysisCache && dataset.analysisCache.statistics !== undefined) {
      console.log(`[Analysis Controller] Returning CACHED analysis data (analyzedAt: ${dataset.analysisCache.analyzedAt})`);
      return res.status(200).json({
        success: true,
        cached: true,
        data: dataset.analysisCache,
      });
    }

    // 5. Check if dataset has data to analyze
    if (!dataset.data || dataset.data.length === 0) {
      return res.status(200).json({
        success: true,
        cached: false,
        data: {
          datasetId: id,
          rowCount: 0,
          status: 'empty',
          summary: { totalColumns: 0, numericColumns: 0, dateColumns: 0, categoricalColumns: 0, totalOutliersDetected: 0, significantCorrelationsCount: 0 },
          statistics: [],
          trends: [],
          performers: [],
          outliers: [],
          correlations: [],
        },
      });
    }

    // 6. Construct payload for Python analysis microservice
    const payload = {
      dataset_id: dataset._id.toString(),
      columns: dataset.columns.map((col) => ({
        name: col.name,
        type: col.type || 'text',
      })),
      data: dataset.data,
    };

    console.log(`[Analysis Controller] Dispatching to Python Microservice (${ANALYSIS_SERVICE_URL}/analyze)...`);
    console.log(`[Analysis Controller] Rows: ${payload.data.length}, Columns: ${payload.columns.length}`);

    const startTime = Date.now();

    // 7. Request to Python service with 15s timeout
    let response;
    try {
      response = await fetch(`${ANALYSIS_SERVICE_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Key': INTERNAL_API_KEY,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (networkError) {
      const elapsed = Date.now() - startTime;
      console.error(`[Analysis Controller] Failed to reach Python microservice after ${elapsed}ms:`, networkError.message);

      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Analysis microservice is temporarily unavailable or timed out. Please ensure the Python service is running on port 8000.',
        details: networkError.name === 'TimeoutError' ? 'Analysis timed out (exceeded 15s limit)' : networkError.message,
      });
    }

    // 8. Handle HTTP errors from Python service
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Analysis Controller] Python microservice returned HTTP ${response.status}:`, errorText);

      return res.status(response.status >= 500 ? 503 : response.status).json({
        error: 'Analysis Service Error',
        message: `Microservice returned status ${response.status}: ${errorText}`,
      });
    }

    const analysisResult = await response.json();
    const duration = Date.now() - startTime;
    console.log(`[Analysis Controller] Successfully analyzed in ${duration}ms. Outliers: ${analysisResult.summary?.totalOutliersDetected}, Trends: ${analysisResult.trends?.length}`);

    // 9. Cache computed analysis in MongoDB
    dataset.analysisCache = analysisResult;
    await dataset.save();
    console.log(`[Analysis Controller] Analysis result successfully cached in MongoDB.`);
    console.log(`========================================\n`);

    return res.status(200).json({
      success: true,
      cached: false,
      durationMs: duration,
      data: analysisResult,
    });
  } catch (error) {
    console.error('[Analysis Controller] Unexpected error:', error);
    next(error);
  }
};
