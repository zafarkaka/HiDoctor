import axios from 'axios';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set auth token
api.setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

import { LoggingService } from './LoggingService';

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Optional: Log successful sensitive requests if needed
    if (response.config.url.includes('auth')) {
       LoggingService.log(`API Success: ${response.config.method.toUpperCase()} ${response.config.url}`, 'info');
    }
    return response;
  },
  (error) => {
    const errorData = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    };
    
    LoggingService.error(`API Error: ${error.message}`, errorData);

    if (error.response?.status === 401) {
      console.log('Unauthorized - Token may be expired');
    }
    return Promise.reject(error);
  }
);

export default api;

// API Service Functions
export const authService = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (data) => api.post('/api/auth/register', data),
  getMe: () => api.get('/api/auth/me'),
  forgotPassword: (phone) => api.post('/api/auth/forgot-password', { phone }),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
};

export const doctorService = {
  list: (params) => api.get('/api/doctors', { params }),
  getById: (id) => api.get(`/api/doctors/${id}`),
  getReviews: (id, params) => api.get(`/api/doctors/${id}/reviews`, { params }),
  getAvailableSlots: (id, date) => api.get(`/api/doctors/${id}/available-slots`, { params: { date } }),
  getMySchedule: () => api.get('/api/doctors/my-schedule'),
  setSchedule: (data) => api.post('/api/doctors/schedule', data),
  blockDates: (dates) => api.post('/api/doctors/availability/block', { dates }),
  getProfile: () => api.get('/api/doctors/profile'),
  updateProfile: (data) => api.post('/api/doctors/profile', data),
  uploadProfilePicture: (formData) => api.post('/api/doctors/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const patientService = {
  getProfile: () => api.get('/api/patients/profile'),
  updateProfile: (data) => api.put('/api/patients/profile', data),
};

export const familyService = {
  list: () => api.get('/api/family-members'),
  add: (data) => api.post('/api/family-members', data),
  remove: (id) => api.delete(`/api/family-members/${id}`),
};

export const appointmentService = {
  list: (params) => api.get('/api/appointments', { params }),
  getById: (id) => api.get(`/api/appointments/${id}`),
  create: (data) => api.post('/api/appointments', data),
  update: (id, data) => api.put(`/api/appointments/${id}`, data),
  cancel: (id) => api.post(`/api/appointments/${id}/cancel`),
  getMessages: (id) => api.get(`/api/appointments/${id}/messages`),
  sendMessage: (id, data) => api.post(`/api/appointments/${id}/messages`, data),
  uploadChatFile: (formData) => api.post('/api/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const reviewService = {
  create: (data) => api.post('/api/reviews', data),
  canReview: (appointmentId) => api.get(`/api/reviews/can-review/${appointmentId}`),
  getMyReviews: () => api.get('/api/reviews/my-reviews'),
};

export const notificationService = {
  list: () => api.get('/api/notifications'),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put('/api/notifications/read-all'),
};

export const reminderService = {
  getUpcoming: () => api.get('/api/reminders/upcoming'),
};

export const configService = {
  getSpecialties: () => api.get('/api/specialties'),
  getLanguages: () => api.get('/api/languages'),
  getInsurances: () => api.get('/api/insurances'),
};

export const paymentService = {
  // Razorpay payments
  createRazorpayOrder: (appointmentId) => 
    api.post('/api/payments/razorpay/create-order', { appointment_id: appointmentId }),
  verifyRazorpayPayment: (data) => 
    api.post('/api/payments/razorpay/verify', data),
  getRazorpayStatus: (orderId) => 
    api.get(`/api/payments/razorpay/status/${orderId}`),
  
  // Stripe payments (if needed)
  createStripeCheckout: (appointmentId) => 
    api.post('/api/payments/create-checkout', { appointment_id: appointmentId }),
  getStripeStatus: (sessionId) => 
    api.get(`/api/payments/status/${sessionId}`),
};

export const contentService = {
  // Ads / Campaigns
  getCampaigns: (placement) => api.get('/api/campaigns', { params: { placement } }),
  trackAdClick: (id) => api.post(`/api/campaigns/${id}/click`),

  // Blog Posts
  getBlogs: () => api.get('/api/blog'),
  getBlogPost: (slug) => api.get(`/api/blog/${slug}`),

  // Top-rated doctors
  getTopDoctors: () => api.get('/api/doctors/top-rated'),
};
