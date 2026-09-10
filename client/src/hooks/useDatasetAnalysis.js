import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

/**
 * Custom hook to fetch and manage statistical analysis from Python microservice (Phase 4)
 */
export const useDatasetAnalysis = (datasetId) => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(Boolean(datasetId));
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [durationMs, setDurationMs] = useState(null);

  const fetchAnalysis = useCallback(async () => {
    if (!datasetId) {
      setAnalysisData(null);
      setLoading(false);
      return;
    }

    try {
      console.log(`[useDatasetAnalysis] Fetching analysis for datasetId: ${datasetId}`);
      setLoading(true);
      setError(null);

      const res = await api.getDatasetAnalysis(datasetId);
      console.log(`[useDatasetAnalysis] Received analysis response:`, res);

      if (res && res.data) {
        setAnalysisData(res.data);
        setIsCached(res.cached || false);
        setDurationMs(res.durationMs || null);
      } else {
        throw new Error('Invalid analysis response structure.');
      }
    } catch (err) {
      console.warn(`[useDatasetAnalysis Warning for ${datasetId}]:`, err.message);
      setError(err.message || 'Statistical analysis temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return {
    analysisData,
    loading,
    error,
    isCached,
    durationMs,
    refetch: fetchAnalysis,
  };
};
