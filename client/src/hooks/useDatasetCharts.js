import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

/**
 * Custom hook to fetch and manage auto-generated chart data for a dataset
 */
export const useDatasetCharts = (datasetId) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(Boolean(datasetId));
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);

  const fetchCharts = useCallback(async () => {
    if (!datasetId) {
      console.log('[useDatasetCharts] No datasetId provided yet, skipping fetch.');
      setChartData(null);
      setLoading(false);
      return;
    }

    try {
      console.log(`[useDatasetCharts] Fetching charts for datasetId: ${datasetId}`);
      setLoading(true);
      setError(null);
      const res = await api.getDatasetCharts(datasetId);
      console.log(`[useDatasetCharts] Received API response:`, res);
      
      if (res && res.data) {
        setChartData(res.data);
        setIsCached(res.cached || false);
      } else {
        throw new Error('Invalid response structure received from server.');
      }
    } catch (err) {
      console.error(`[useDatasetCharts Error for ${datasetId}]:`, err);
      setError(err.message || 'Failed to generate visual charts for this dataset.');
      toast.error(err.message || 'Failed to load visual charts.');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  return {
    chartData,
    loading,
    error,
    isCached,
    refetch: fetchCharts,
  };
};
