// src/utils/api.js
// Centralized fetch wrapper that auto-injects JWT Authorization headers

const API_BASE = '';

const getAuthHeader = () => {
  const token = localStorage.getItem('ergonomics_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = {
  get: (url) =>
    fetch(`${API_BASE}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    }),

  post: (url, body) =>
    fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(body),
    }),

  delete: (url) =>
    fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    }),

  downloadUrl: (url) => {
    // Returns a URL with token as query param — for anchor href downloads
    const token = localStorage.getItem('ergonomics_token');
    return `${API_BASE}${url}${token ? `?token=${token}` : ''}`;
  },
};

export default api;
