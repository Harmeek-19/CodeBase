import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return Promise.reject(error);
      }

      try {
        const response = await api.post('/refresh', { refresh_token: refreshToken });
        const { access_token, refresh_token } = response.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('refreshToken', refresh_token);
        api.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
        processQueue(null, access_token);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Keeping the rest of the exports intact
export const login = (email, password) => api.post('/login', { email, password });
export const signup = (name, email, password) => api.post('/signup', { name, email, password });
export const refreshToken = () => api.post('/refresh');

export const generateApiKey = () => api.post('/generate_key');
export const api_gather_data = () => api.post('/gather');  // Changed from GET to POST
export const api_get_data = async (page = 1, perPage = 10) => {
  return await api.get(`/data?page=${page}&per_page=${perPage}`);
};

export const getDocumentations = async (snippetId) => {
  return await api.get(`/documentation/${snippetId}?format=markdown`);
};

export const searchCodesnippetList = (params) => api.get('/search', { params });

export const submitCode = (data) => {
  return api.post('/submit', data);
};

export const submitCorrection = (data) => api.post('/submit-correction', data);

export const api_get_user_snippets = async (page = 1, perPage = 10) => {
  const response = await api.get(`/user-snippets?page=${page}&per_page=${perPage}`);
  return response.data;
};

export const getDocumentation = async (snippetId) => {
  return await api.get(`/documentation/${snippetId}`);
};

export const generateDocs = async (snippetId) => {
  return await api.post(`/documentation/generate/${snippetId}`);
};

export const checkAuthToken = () => {
  return localStorage.getItem('token') !== null;
};

export const getDashboardData = async (page = 1, perPage = 10) => {
  try {
    const response = await api.get(`/dashboard?page=${page}&per_page=${perPage}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

export default api;
