import { auth, isFirebaseConfigured } from '../firebase/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Retrieves the current authorization token.
 * Returns real Firebase JWT if configured, or signed demo token for testing.
 */
export const getAuthToken = async () => {
  if (isFirebaseConfigured && auth && auth.currentUser) {
    return await auth.currentUser.getIdToken();
  }

  // Demo user token retrieval
  const savedDemoUser = localStorage.getItem('demo_user');
  if (savedDemoUser) {
    try {
      const user = JSON.parse(savedDemoUser);
      return `demo-token:${btoa(JSON.stringify({ uid: user.uid, email: user.email, displayName: user.displayName }))}`;
    } catch (e) {
      // fallback
    }
  }

  return `demo-token:${btoa(JSON.stringify({ uid: 'demo-user-default', email: 'founder@smartbusiness.ai' }))}`;
};

/**
 * Common request wrapper with authentication headers.
 */
const request = async (endpoint, options = {}) => {
  const token = await getAuthToken();

  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
};

/**
 * API Service Methods
 */
export const api = {
  // Upload a CSV or Excel file
  uploadDataset: async (file) => {
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'File upload failed.');
    }

    return data;
  },

  // Get all datasets for logged-in user
  getDatasets: async () => {
    return request('/datasets', { method: 'GET' });
  },

  // Get specific dataset details and preview rows
  getDatasetById: async (id) => {
    return request(`/datasets/${id}`, { method: 'GET' });
  },

  // Get auto-generated charts and KPIs for dataset
  getDatasetCharts: async (id) => {
    return request(`/datasets/${id}/charts`, { method: 'GET' });
  },

  // Get deep statistical analysis from Python microservice (Phase 4)
  getDatasetAnalysis: async (id) => {
    return request(`/datasets/${id}/analysis`, { method: 'GET' });
  },

  // Get AI plain-English business insights (Phase 5)
  getDatasetInsights: async (id, refresh = false) => {
    const query = refresh ? '?refresh=true' : '';
    return request(`/datasets/${id}/insights${query}`, { method: 'GET' });
  },

  // Delete a dataset
  deleteDataset: async (id) => {
    return request(`/datasets/${id}`, { method: 'DELETE' });
  },
};
