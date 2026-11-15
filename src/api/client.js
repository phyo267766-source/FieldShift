/**
 * FieldShift API Client
 * Centralized API communication with the Flask backend.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5001').replace(/\/+$/, '');

/**
 * Make an API request with error handling.
 */
async function apiRequest(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    let data;
    try {
      data = await response.json();
    } catch {
      throw new ApiError(
        response.ok
          ? 'The FieldShift backend returned an invalid JSON response.'
          : `Request failed with status ${response.status}`,
        response.status,
        null
      );
    }

    if (!response.ok) {
      throw new ApiError(
        (data && data.error) || `Request failed with status ${response.status}`,
        response.status,
        (data && data.details) || null
      );
    }

    if (responseCreatesNotification(path, config.method, data)) {
      window.dispatchEvent(new Event('fieldshift:notifications-updated'));
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Network error — backend probably not running
    throw new ApiError(
      'Could not connect to the FieldShift backend. Is the Flask server running?',
      0,
      null
    );
  }
}

function responseCreatesNotification(path, method = 'GET', data) {
  const requestMethod = method.toUpperCase();
  return (
    (path === '/api/farms' && requestMethod === 'POST') ||
    (/^\/api\/farms\/\d+$/.test(path) && requestMethod === 'PUT') ||
    (path === '/api/rotation/generate' && requestMethod === 'POST' && data?.success && data?.plan) ||
    (/^\/api\/climate\/farm\/\d+/.test(path) && data?.success && !data?.cached)
  );
}

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

// ── Farm API ────────────────────────────────────────────────────────────────

export const farmApi = {
  getAll: () => apiRequest('/api/farms'),

  getById: (id) => apiRequest(`/api/farms/${id}`),

  create: (farmData) =>
    apiRequest('/api/farms', {
      method: 'POST',
      body: JSON.stringify(farmData),
    }),

  update: (id, farmData) =>
    apiRequest(`/api/farms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(farmData),
    }),

  delete: (id) =>
    apiRequest(`/api/farms/${id}`, { method: 'DELETE' }),
};

// ── Climate API ─────────────────────────────────────────────────────────────

export const climateApi = {
  getFarmClimate: (farmId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/climate/farm/${farmId}${query ? `?${query}` : ''}`);
  },

  getHistory: (farmId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/climate/history/${farmId}${query ? `?${query}` : ''}`);
  },

  getSummary: (farmId) => apiRequest(`/api/climate/summary/${farmId}`),
};

// ── Rotation API ────────────────────────────────────────────────────────────

export const rotationApi = {
  generate: (data) =>
    apiRequest('/api/rotation/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  compare: (data) =>
    apiRequest('/api/rotation/compare', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getFarmPlans: (farmId) => apiRequest(`/api/rotation/farm/${farmId}`),

  getSelection: (conditions) => {
    const query = new URLSearchParams(conditions).toString();
    return apiRequest(`/api/rotation/selection?${query}`);
  },

  saveSelection: (selection) =>
    apiRequest('/api/rotation/selection', {
      method: 'POST',
      body: JSON.stringify(selection),
    }),

  getPlan: (planId) => apiRequest(`/api/rotation/${planId}`),

  selectPlan: (planId) =>
    apiRequest(`/api/rotation/${planId}/select`, { method: 'PUT' }),
};

// ── Weather API (Meteomatics via backend) ──────────────────────────────────

export const weatherApi = {
  /** Check if Meteomatics credentials are configured */
  status: () => apiRequest('/api/weather/status'),

  /** Get current weather for coordinates */
  getCurrent: (lat, lon) =>
    apiRequest(`/api/weather/current?lat=${lat}&lon=${lon}`),

  /** Get hourly forecast */
  getHourlyForecast: (lat, lon, hours = 24) =>
    apiRequest(`/api/weather/forecast/hourly?lat=${lat}&lon=${lon}&hours=${hours}`),

  /** Get daily forecast */
  getDailyForecast: (lat, lon, days = 7) =>
    apiRequest(`/api/weather/forecast/daily?lat=${lat}&lon=${lon}&days=${days}`),
};

// ── Chat API (Agricultural Chatbot) ────────────────────────────────────────

export const chatApi = {
  /** Send a message to the farming assistant */
  send: (message, { context = null, history = null, language = 'en', farm_id = null } = {}) =>
    apiRequest('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context, history, language, farm_id }),
    }),

  /** Check the chat service status (AI enabled, mode, etc.) */
  status: () => apiRequest('/api/chat/status'),
};

// ── Report API ──────────────────────────────────────────────────────────────

export const reportApi = {
  create: (data) =>
    apiRequest('/api/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getFarmReports: (farmId) => apiRequest(`/api/reports/farm/${farmId}`),

  getReport: (reportId) => apiRequest(`/api/reports/${reportId}`),

  downloadPdf: async (reportId) => {
    try {
      const response = await fetch(`${API_BASE}/api/reports/${reportId}/pdf`);
      if (!response.ok) {
        let data = null;
        try {
          data = await response.json();
        } catch {
          data = null;
        }
        throw new ApiError(
          (data && data.error) || `PDF download failed with status ${response.status}`,
          response.status,
          (data && data.details) || null
        );
      }
      return response.blob();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(
        'Could not connect to the FieldShift backend to download the report PDF.',
        0,
        null
      );
    }
  },
};

export const notificationApi = {
  getAll: () => apiRequest('/api/notifications'),

  markAllRead: () => apiRequest('/api/notifications/read', { method: 'PUT' }),

  markRead: (notificationId) =>
    apiRequest(`/api/notifications/${notificationId}/read`, { method: 'PATCH' }),

  dismiss: (notificationId) =>
    apiRequest(`/api/notifications/${notificationId}`, { method: 'DELETE' }),
};

export { ApiError };
export default {
  farmApi,
  climateApi,
  weatherApi,
  rotationApi,
  chatApi,
  reportApi,
  notificationApi,
};
