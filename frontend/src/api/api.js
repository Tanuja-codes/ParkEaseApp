import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
   const userStr = localStorage.getItem('user');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (userId) {
      config.headers['userId'] = userId;
    }

 if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role) {
          config.headers['role'] = user.role;
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  registerAdmin: (data) => api.post('/auth/register/admin', data),
  login: (data) => api.post('/auth/login', data),
};

// Location API
export const locationAPI = {
  getAll: () => api.get('/locations'),
  getById: (id) => api.get(`/locations/${id}`),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  updatePricing: (id, pricing) => api.patch(`/locations/${id}/pricing`, { pricing }),
  delete: (id) => api.delete(`/locations/${id}`),
};

// Slot API
export const slotAPI = {
  getByLocation: (locationId) => api.get(`/slots/location/${locationId}`),
  getAvailable: (locationId, startTime, endTime) =>
    api.get(`/slots/location/${locationId}/available`, { params: { startTime, endTime } }),
  create: (data) => api.post('/slots', data),
  update: (id, data) => api.put(`/slots/${id}`, data),
  toggleStatus: (id, status) => api.patch(`/slots/${id}/status`, { status }),
  delete: (id) => api.delete(`/slots/${id}`),
};

// Booking API
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: (status) => api.get('/bookings/my-bookings', { params: { status } }),
  getById: (id) => api.get(`/bookings/${id}`),
  startTimer: (id) => api.post(`/bookings/${id}/start-timer`),
  stopTimer: (id) => api.post(`/bookings/${id}/stop-timer`),
  cancel: (id, reason) => api.post(`/bookings/${id}/cancel`, { reason }),
  delete: (id) => api.delete(`/bookings/${id}`),
  extend: (id) => api.post(`/bookings/${id}/extend`),
};

// Admin API
export const adminAPI = {
  getBookings: (params) => api.get('/admin/bookings', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  toggleUserStatus: (userId) => api.patch(`/admin/users/${userId}/toggle-status`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  deleteBooking: (bookingId) => api.delete(`/admin/bookings/${bookingId}`),
  getDashboardStats: (params) => api.get('/admin/statistics/dashboard', { params }),
  getRevenueComparison: (params) => api.get('/admin/statistics/revenue-comparison', { params }),
  getPeakHours: (params) => api.get('/admin/statistics/peak-hours', { params }),
};

// Reports API
export const reportsAPI = {
  getMonthlyUsage: (params) => api.get('/reports/monthly-usage', { params }),
  exportBookings: (params) => api.get('/reports/export/bookings', {
    params,
    responseType: 'blob'
  }),
  exportSlotUsage: (params) => api.get('/reports/export/slot-usage', {
    params,
    responseType: 'blob'
  }),
  exportRevenue: (params) => api.get('/reports/export/revenue', {
    params,
    responseType: 'blob'
  }),
};

export default api;
