import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

/**
 * Custom hook to fetch and manage predictive trend forecast data (Phase 6)
 */
export const useDatasetForecast = (datasetId) => {
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(Boolean(datasetId));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);

  const fetchForecast = useCallback(
    async (forceRefresh = false) => {
      if (!datasetId) {
        setForecastData(null);
        setLoading(false);
        return;
      }

      try {
        console.log(`[useDatasetForecast] Fetching forecast for datasetId: ${datasetId} (refresh=${forceRefresh})`);
        if (forceRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const res = await api.getDatasetForecast(datasetId, forceRefresh);
        console.log(`[useDatasetForecast] Received forecast response:`, res);

        if (res && res.data) {
          setForecastData(res.data);
          setIsCached(res.cached || false);

          if (forceRefresh) {
            toast.success('Forecast projections recalculated!');
          }
        } else {
          throw new Error('Invalid forecast structure received.');
        }
      } catch (err) {
        console.warn(`[useDatasetForecast Warning for ${datasetId}]:`, err.message);
        const errMsg = err.message || 'Forecast calculation service temporarily unavailable.';
        setError(errMsg);

        if (errMsg.toLowerCase().includes('limit') || errMsg.includes('429')) {
          toast.error("You've reached the forecast refresh limit. Please try again in a bit.");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [datasetId]
  );

  useEffect(() => {
    fetchForecast(false);
  }, [fetchForecast]);

  return {
    forecastData,
    loading,
    refreshing,
    error,
    isCached,
    refetch: fetchForecast,
  };
};
