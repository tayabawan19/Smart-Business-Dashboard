import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

/**
 * Custom hook to fetch and manage auto-generated chart data for a dataset
 */
export const useDatasetCharts = (datasetId) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);

  const fetchCharts = useCallback(async () => {
    if (!datasetId) {
      setChartData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.getDatasetCharts(datasetId);
      setChartData(res.data);
      setIsCached(res.cached || false);
    } catch (err) {
      console.error('[useDatasetCharts Error]', err);
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
