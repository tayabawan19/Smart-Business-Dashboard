import mongoose from 'mongoose';
import { Dataset } from '../models/dataset.model.js';
import { generateBusinessInsights } from '../services/llm.service.js';

const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://localhost:8000';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'sbd_internal_secure_key_2026';

/**
 * Controller to fetch or generate AI plain-English business insights for a dataset
 * GET /api/datasets/:id/insights
 */
export const getDatasetInsights = async (req, res, next) => {
  const { id } = req.params;
  const isRefresh = req.query.refresh === 'true';
  const userIdentifiers = [req.user?.uid, req.user?.email].filter(Boolean);

  console.log(`\n========================================`);
  console.log(`[Insights Controller] Request received for datasetId: ${id} (refresh=${isRefresh})`);
  console.log(`[Insights Controller] Authenticated user identifiers: [${userIdentifiers.join(', ')}]`);

  // 1. Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: 'Invalid ID',
      message: 'Invalid dataset identifier format.',
    });
  }

  try {
    // 2. Fetch dataset
    const dataset = await Dataset.findById(id);

    if (!dataset) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Dataset not found.',
      });
    }

    // 3. Ownership check
    if (!userIdentifiers.includes(dataset.userId)) {
      console.warn(`[Insights Controller] Ownership mismatch for dataset ${id}`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view insights for this dataset.',
      });
    }

    // 4. Return cached insights if available and not explicitly refreshing
    if (!isRefresh && dataset.insightsCache && Array.isArray(dataset.insightsCache.insights)) {
      console.log(`[Insights Controller] Returning CACHED AI insights (generatedAt: ${dataset.insightsCache.generatedAt})`);
      return res.status(200).json({
        success: true,
        cached: true,
        data: dataset.insightsCache.insights,
        provider: dataset.insightsCache.provider || 'cached',
        mode: dataset.insightsCache.mode || 'cached',
        generatedAt: dataset.insightsCache.generatedAt,
      });
    }

    // 5. Check if dataset has rows
    if (!dataset.data || dataset.data.length === 0) {
      return res.status(200).json({
        success: true,
        cached: false,
        data: [],
        message: 'Dataset contains no rows to analyze.',
      });
    }

    // 6. Ensure Phase 4 statistical analysis is present
    let analysisData = dataset.analysisCache;
    if (!analysisData || !analysisData.statistics) {
      console.log(`[Insights Controller] Analysis cache missing. Triggering Python microservice analysis...`);
      const payload = {
        dataset_id: dataset._id.toString(),
        columns: dataset.columns.map((col) => ({
          name: col.name,
          type: col.type || 'text',
        })),
        data: dataset.data,
      };

      try {
        const pyRes = await fetch(`${ANALYSIS_SERVICE_URL}/analyze`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Key': INTERNAL_API_KEY,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000),
        });

        if (pyRes.ok) {
          analysisData = await pyRes.json();
          dataset.analysisCache = analysisData;
          await dataset.save();
          console.log(`[Insights Controller] Statistical analysis generated and cached.`);
        } else {
          console.warn(`[Insights Controller] Python analysis returned status ${pyRes.status}. Using fallback stats.`);
        }
      } catch (pyErr) {
        console.warn(`[Insights Controller] Could not reach Python service: ${pyErr.message}`);
      }
    }

    // Fallback minimal structure if Python analysis could not run
    if (!analysisData) {
      analysisData = {
        rowCount: dataset.rowCount,
        statistics: dataset.columns.filter((c) => c.type === 'number').map((c) => ({ column: c.name })),
        trends: [],
        performers: [],
        outliers: [],
        correlations: [],
      };
    }

    // 7. Generate plain-English AI explanations via LLM service
    console.log(`[Insights Controller] Generating AI insights for "${dataset.fileName}"...`);
    const insightsResult = await generateBusinessInsights(analysisData, dataset.fileName);

    // 8. Cache insights on MongoDB dataset document
    dataset.insightsCache = insightsResult;
    await dataset.save();
    console.log(`[Insights Controller] Insights cached in MongoDB.`);
    console.log(`========================================\n`);

    return res.status(200).json({
      success: true,
      cached: false,
      data: insightsResult.insights,
      provider: insightsResult.provider,
      mode: insightsResult.mode,
      generatedAt: insightsResult.generatedAt,
    });
  } catch (error) {
    console.error('[Insights Controller] Error generating insights:', error);
    return res.status(500).json({
      error: 'Insight Generation Failed',
      message: 'Failed to generate AI insights. Please try again in a moment.',
    });
  }
};
