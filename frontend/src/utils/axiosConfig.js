// src/utils/axiosConfig.js
import axios from 'axios';
import { getAuthToken, validateAuthToken } from './auth';

// Create a reusable axios instance with interceptors
const createAuthenticatedAxios = () => {
  const instance = axios.create();
  
  // Request interceptor to add auth token to all requests
  instance.interceptors.request.use(
    (config) => {
      // Check token validity
      const tokenStatus = validateAuthToken();
      const token = getAuthToken();
      
      if (!token || !tokenStatus.valid) {
        console.warn('Token validation failed:', tokenStatus.message);
        // Clear auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenExpires');
        localStorage.removeItem('user');
        localStorage.removeItem('profileData');
        
        // Store current path for redirect
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/signin')) {
          localStorage.setItem('redirectAfterLogin', currentPath);
          window.location.href = '/#/signin';
        }
        
        return Promise.reject(new Error('Authentication required'));
      }
      
      // Apply the token to the headers
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
  
  // Response interceptor to handle auth errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle 401 Unauthorized or 403 Forbidden
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.error('Authentication error:', error.response.status);
        
        // Clear all auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('tokenExpires');
        localStorage.removeItem('user');
        localStorage.removeItem('profileData');
        
        // Check if we're already on the signin page to prevent redirect loops
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/signin')) {
          // Store the current location to redirect back after login
          localStorage.setItem('redirectAfterLogin', currentPath);
          
          // Show error message
          if (window.toast) {
            window.toast.error('Your session has expired. Please sign in again.');
          }
          
          // Redirect to signin page
          window.location.href = '/#/signin';
        }
      }
      return Promise.reject(error);
    }
  );
  
  return instance;
};

// For normal form data (JSON) requests
export const authAxios = createAuthenticatedAxios();

// For file upload requests with FormData
export const createFormDataAxios = () => {
  const instance = createAuthenticatedAxios();
  
  // Special handling for FormData - don't set Content-Type
  instance.interceptors.request.use(
    (config) => {
      // For FormData, browser will set the Content-Type with boundary
      if (config.data instanceof FormData) {
        // Remove Content-Type header to let the browser set it with correct boundary
        delete config.headers['Content-Type'];
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  return instance;
};

export const formDataAxios = createFormDataAxios();

export default createAuthenticatedAxios;
