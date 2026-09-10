import mongoose from 'mongoose';
import { Dataset } from '../models/dataset.model.js';
import { generateAutoCharts } from '../utils/chartEngine.js';

/**
 * Controller to fetch or generate auto-charting payload for a dataset
 * GET /api/datasets/:id/charts
 */
export const getDatasetCharts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.uid;

    console.log(`\n========================================`);
    console.log(`[Backend Chart Controller] Request received for datasetId: ${id}`);
    console.log(`[Backend Chart Controller] Authenticated userId: ${userId}`);

    // 1. Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn(`[Backend Chart Controller] Invalid ObjectId format: "${id}"`);
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Invalid dataset identifier format.',
      });
    }

    // 2. Fetch dataset from MongoDB
    const dataset = await Dataset.findById(id);

    if (!dataset) {
      console.warn(`[Backend Chart Controller] Dataset NOT found in MongoDB for id: ${id}`);
      return res.status(404).json({
        error: 'Not Found',
        message: 'Dataset not found.',
      });
    }

    console.log(`[Backend Chart Controller] Dataset found in MongoDB: "${dataset.fileName}" (${dataset.rowCount} rows, ${dataset.columnCount} columns)`);

    // 3. Ownership check
    if (dataset.userId !== userId) {
      console.warn(`[Backend Chart Controller] Ownership mismatch: dataset.userId (${dataset.userId}) !== req.user.uid (${userId})`);
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view charts for this dataset.',
      });
    }

    // 4. Return cached chart payload if available
    if (dataset.chartCache && dataset.chartCache.canChart !== undefined) {
      console.log(`[Backend Chart Controller] Returning CACHED chart data. Total KPIs: ${dataset.chartCache.kpis?.length || 0}, Total Charts: ${dataset.chartCache.charts?.length || 0}`);
      return res.status(200).json({
        success: true,
        cached: true,
        data: dataset.chartCache,
      });
    }

    // 5. Generate chart data using the charting engine
    console.log(`[Backend Chart Controller] Computing fresh auto-charts from raw rows...`);
    const chartPayload = generateAutoCharts(dataset);

    console.log(`[Backend Chart Controller] Chart generation complete.`);
    console.log(`[Backend Chart Controller] Result: canChart=${chartPayload.canChart}, KPIs=${chartPayload.kpis?.length || 0}, Charts=${chartPayload.charts?.length || 0}`);
    if (chartPayload.charts?.length > 0) {
      console.log(`[Backend Chart Controller] Chart Types:`, chartPayload.charts.map(c => `[${c.type.toUpperCase()}] ${c.title}`));
    }

    // 6. Cache the computed charts on the dataset document
    dataset.chartCache = chartPayload;
    await dataset.save();
    console.log(`[Backend Chart Controller] Chart payload cached on MongoDB dataset document.`);
    console.log(`========================================\n`);

    return res.status(200).json({
      success: true,
      cached: false,
      data: chartPayload,
    });
  } catch (error) {
    console.error('[Backend Chart Controller Exception]', error);
    next(error);
  }
};
