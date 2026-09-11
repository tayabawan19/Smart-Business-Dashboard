import mongoose from 'mongoose';
import { Dataset } from '../models/dataset.model.js';
import { generateForecastExplanation } from '../services/llm.service.js';

const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://localhost:8000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'sbd_internal_secure_key_2026';
const TIMEOUT_MS = 15000;

/**
 * Controller to fetch or compute time-series forecast via Python microservice (Phase 6)
 * GET /api/datasets/:id/forecast
 */
export const getDatasetForecast = async (req, res, next) => {
  const { id } = req.params;
  const isRefresh = req.query.refresh === 'true';
  const userIdentifiers = [req.user?.uid, req.user?.email].filter(Boolean);

  console.log(`\n========================================`);
  console.log(`[Forecast Controller] Request received for datasetId: ${id} (refresh=${isRefresh})`);
  console.log(`[Forecast Controller] Authenticated user identifiers: [${userIdentifiers.join(', ')}]`);

  // 1. Validate MongoDB ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.warn(`[Forecast Controller] Invalid ObjectId format: "${id}"`);
    return res.status(400).json({
      error: 'Invalid ID',
      message: 'Invalid dataset identifier format.',
    });
  }

  try {
    // 2. Fetch dataset from MongoDB
    const dataset = await Dataset.findById(id);

    if (!dataset) {
      console.warn(`[Forecast Controller] Dataset NOT found in MongoDB for id: ${id}`);
      return res.status(404).json({
        error: 'Not Found',
        message: 'Dataset not found.',
      });
    }

    // 3. Ownership check
    if (!userIdentifiers.includes(dataset.userId)) {
      console.warn(`[Forecast Controller] Ownership mismatch: dataset.userId (${dataset.userId}) not in [${userIdentifiers.join(', ')}]`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view forecast for this dataset.',
      });
    }

    // 4. Return cached forecast if available and not explicitly refreshing
    if (!isRefresh && dataset.forecastCache && dataset.forecastCache.canForecast !== undefined) {
      console.log(`[Forecast Controller] Returning CACHED forecast data (forecast periods: ${dataset.forecastCache.periods?.length || 0})`);
      return res.status(200).json({
        success: true,
        cached: true,
        data: dataset.forecastCache,
      });
    }

    // 5. Check if dataset has data rows
    if (!dataset.data || dataset.data.length === 0) {
      return res.status(200).json({
        success: true,
        cached: false,
        data: {
          canForecast: false,
          message: 'Dataset contains no rows to forecast.',
          periods: [],
          forecastedValues: [],
          confidenceRange: [],
          method: 'linear_trend',
        },
      });
    }

    // 6. Check if dataset has at least one date column
    const hasDateCol = dataset.columns.some((c) => c.type === 'date');
    if (!hasDateCol) {
      console.log(`[Forecast Controller] Dataset "${dataset.fileName}" has no column typed as date.`);
      return res.status(200).json({
        success: true,
        cached: false,
        data: {
          canForecast: false,
          message: 'Forecasting requires a date column, none found in this dataset.',
          periods: [],
          forecastedValues: [],
          confidenceRange: [],
          method: 'linear_trend',
        },
      });
    }

    // 7. Check if dataset has at least one numeric column
    const hasNumCol = dataset.columns.some((c) => c.type === 'number');
    if (!hasNumCol) {
      console.log(`[Forecast Controller] Dataset "${dataset.fileName}" has no numeric column.`);
      return res.status(200).json({
        success: true,
        cached: false,
        data: {
          canForecast: false,
          message: 'Forecasting requires at least one numeric metric, none found in this dataset.',
          periods: [],
          forecastedValues: [],
          confidenceRange: [],
          method: 'linear_trend',
        },
      });
    }

    // 8. Construct payload for Python forecasting microservice
    const payload = {
      dataset_id: dataset._id.toString(),
      columns: dataset.columns.map((col) => ({
        name: col.name,
        type: col.type || 'text',
      })),
      data: dataset.data,
      periods_to_project: 5,
    };

    console.log(`[Forecast Controller] Dispatching to Python Microservice (${ANALYSIS_SERVICE_URL}/forecast)...`);
    const startTime = Date.now();

    // 9. Request to Python service with 15s timeout
    let response;
    try {
      response = await fetch(`${ANALYSIS_SERVICE_URL}/forecast`, {
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
      console.error(`[Forecast Controller] Failed to reach Python microservice after ${elapsed}ms:`, networkError.message);

      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Forecast service is temporarily unavailable or timed out. Please ensure the Python service is running on port 8000.',
        details: networkError.name === 'TimeoutError' ? 'Forecast calculation timed out (exceeded 15s limit)' : networkError.message,
      });
    }

    // 10. Handle HTTP errors from Python service
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Forecast Controller] Python microservice returned HTTP ${response.status}:`, errorText);

      return res.status(response.status >= 500 ? 503 : response.status).json({
        error: 'Forecast Service Error',
        message: `Microservice returned status ${response.status}: ${errorText}`,
      });
    }

    const forecastResult = await response.json();
    const duration = Date.now() - startTime;
    console.log(`[Forecast Controller] Forecast calculated in ${duration}ms. canForecast: ${forecastResult.canForecast}`);

    // 11. Generate plain-English AI explanation if forecast is valid
    if (forecastResult.canForecast) {
      try {
        console.log(`[Forecast Controller] Generating AI plain-English forecast narrative...`);
        const explanationRes = await generateForecastExplanation(forecastResult, dataset.fileName);
        forecastResult.explanation = explanationRes.explanation;
        forecastResult.explanationProvider = explanationRes.provider;
        forecastResult.explanationMode = explanationRes.mode;
        console.log(`[Forecast Controller] AI explanation: "${forecastResult.explanation}"`);
      } catch (explainErr) {
        console.warn(`[Forecast Controller] AI explanation generation failed, using default:`, explainErr.message);
        forecastResult.explanation = 'Forecast is projected based on historical trend trajectory as an estimate, not a guarantee.';
      }
    }

    // 12. Cache computed forecast in MongoDB
    dataset.forecastCache = forecastResult;
    await dataset.save();
    console.log(`[Forecast Controller] Forecast result successfully cached in MongoDB.`);
    console.log(`========================================\n`);

    return res.status(200).json({
      success: true,
      cached: false,
      durationMs: duration,
      data: forecastResult,
    });
  } catch (error) {
    console.error('[Forecast Controller] Unexpected error:', error);
    next(error);
  }
};
