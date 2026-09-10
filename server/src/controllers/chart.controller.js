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
    const userId = req.user.uid;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: 'Invalid ID',
        message: 'Invalid dataset identifier format.',
      });
    }

    const dataset = await Dataset.findById(id);

    if (!dataset) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Dataset not found.',
      });
    }

    // Ownership check
    if (dataset.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to view charts for this dataset.',
      });
    }

    // Return cached chart payload if available
    if (dataset.chartCache && dataset.chartCache.canChart !== undefined) {
      return res.status(200).json({
        success: true,
        cached: true,
        data: dataset.chartCache,
      });
    }

    // Generate chart data using the charting engine
    const chartPayload = generateAutoCharts(dataset);

    // Cache the computed charts on the dataset document
    dataset.chartCache = chartPayload;
    await dataset.save();

    return res.status(200).json({
      success: true,
      cached: false,
      data: chartPayload,
    });
  } catch (error) {
    console.error('[Chart Controller Error]', error);
    next(error);
  }
};
