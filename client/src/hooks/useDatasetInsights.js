import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

/**
 * Custom hook to fetch and manage AI-generated business insights (Phase 5)
 */
export const useDatasetInsights = (datasetId) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(Boolean(datasetId));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [provider, setProvider] = useState(null);
  const [mode, setMode] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);

  const fetchInsights = useCallback(
    async (forceRefresh = false) => {
      if (!datasetId) {
        setInsights(null);
        setLoading(false);
        return;
      }

      try {
        console.log(`[useDatasetInsights] Fetching insights for datasetId: ${datasetId} (refresh=${forceRefresh})`);
        if (forceRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const res = await api.getDatasetInsights(datasetId, forceRefresh);
        console.log(`[useDatasetInsights] Received insights response:`, res);

        if (res && res.data) {
          setInsights(res.data);
          setIsCached(res.cached || false);
          setProvider(res.provider || 'AI');
          setMode(res.mode || 'standard');
          setGeneratedAt(res.generatedAt || null);

          if (forceRefresh) {
            toast.success('AI insights freshly recalculated!');
          }
        } else {
          throw new Error('Invalid insights structure received.');
        }
      } catch (err) {
        console.warn(`[useDatasetInsights Warning for ${datasetId}]:`, err.message);
        const errMsg = err.message || 'AI explanation service temporarily unavailable.';
        setError(errMsg);

        // If rate limited, show friendly toast without destroying previously loaded insights
        if (errMsg.toLowerCase().includes('limit') || errMsg.includes('429')) {
          toast.error("You've reached the insight refresh limit. Please try again in a bit.");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [datasetId]
  );

  useEffect(() => {
    fetchInsights(false);
  }, [fetchInsights]);

  return {
    insights,
    loading,
    refreshing,
    error,
    isCached,
    provider,
    mode,
    generatedAt,
    refetch: fetchInsights,
  };
};
