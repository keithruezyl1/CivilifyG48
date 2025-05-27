// src/utils/auth.js
import axios from 'axios';
// Import the pre-configured axios instances - but we'll use direct axios for profile operations
// to avoid circular dependencies
import { authAxios, formDataAxios } from './axiosConfig';
// Import the backend health check utility
import { checkBackendHealth, testCorsConfiguration } from './backendHealthCheck';

// API URL for the backend with debugging
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
export const API_URL = `${apiBaseUrl}/api`;

// Log API URL configuration for debugging
console.log('API URL configured as:', API_URL);

// Get the stored authentication token
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Clear all authentication data - useful when logging out or when there's an authentication error
export const clearAuthData = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('tokenExpires');
  localStorage.removeItem('user');
  localStorage.removeItem('profileData');
  localStorage.removeItem('currentConversationId');
  localStorage.removeItem('chatMessages');
  localStorage.removeItem('selectedMode');
  localStorage.removeItem('redirectAfterLogin');
  console.log('All auth data cleared');
};

// Validate if token exists and is potentially valid (not expired)
export const validateAuthToken = () => {
  const token = getAuthToken();
  
  if (!token) {
    return { valid: false, message: 'No authentication token found' };
  }
  
  try {
    // Basic structure check - JWT has 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, message: 'Invalid token format' };
    }
    
    // Try to decode the payload to check expiration
    const payload = JSON.parse(atob(parts[1]));
    const now = Date.now() / 1000; // Convert to seconds
    
    // Check if token is expired
    if (payload.exp && payload.exp < now) {
      // Token has expired
      localStorage.removeItem('authToken'); // Clear the expired token
      return { valid: false, message: 'Token has expired' };
    }
    
    // Check if token is about to expire soon (within 30 minutes)
    const thirtyMinutesInSeconds = 30 * 60;
    if (payload.exp && payload.exp < now + thirtyMinutesInSeconds) {
      // Token will expire soon, but is still valid
      return { 
        valid: true, 
        message: 'Token will expire soon', 
        expiresAt: new Date(payload.exp * 1000),
        expiresIn: Math.floor(payload.exp - now)
      };
    }
    
    return { 
      valid: true, 
      message: 'Token is valid',
      expiresAt: new Date(payload.exp * 1000),
      expiresIn: Math.floor(payload.exp - now)
    };
  } catch (error) {
    console.error('Error validating token:', error);
    return { valid: false, message: 'Error validating token' };
  }
};

// Get stored user data from localStorage (fallback)
export const getUserData = () => {
  const data = localStorage.getItem('user');
  if (data) {
    try {
      const parsedData = JSON.parse(data);
      console.log("getUserData returning:", parsedData);
      return parsedData;
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      return null;
    }
  }
  return null;
};

// Get user's profile picture URL - can be used both synchronously and asynchronously
export const getProfilePicture = async (forceRefresh = false) => {
  try {
    // For synchronous usage, first check localStorage
    if (!forceRefresh) {
      const userData = getUserData();
      if (userData?.profile_picture_url) {
        console.log("getProfilePicture returning from localStorage:", userData.profile_picture_url);
        return userData.profile_picture_url;
      }
    }
    
    // If no data in localStorage or forceRefresh is true, fetch from backend
    console.log("getProfilePicture fetching from backend");
    const userData = await fetchUserProfile();
    console.log("getProfilePicture received from backend:", userData);
    return userData?.profile_picture_url || null;
  } catch (error) {
    console.error('Error getting profile picture:', error);
    return null;
  }
};

// Synchronous version for components that can't use async
export const getProfilePictureSync = () => {
  const userData = getUserData();
  const profilePicUrl = userData?.profile_picture_url || null;
  console.log("getProfilePictureSync returning:", profilePicUrl);
  return profilePicUrl;
};

// Fetch user profile from the backend API
export const fetchUserProfile = async () => {
  try {
    // First validate token before making the request
    const tokenStatus = validateAuthToken();
    console.log("fetchUserProfile token status:", tokenStatus);
    
    if (!tokenStatus.valid) {
      console.error('Invalid auth token:', tokenStatus.message);
      // Clear all auth data if token is invalid
      clearAuthData();
      return null; // Return null to indicate authentication failure
    }
    
    const token = getAuthToken();
    console.log('Fetching user profile with authenticated request');
    
    // Create a custom headers object with debugging info
    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Token-Debug': 'true',
      'X-Token-Status': JSON.stringify({
        valid: tokenStatus.valid,
        expiresIn: tokenStatus.expiresIn
      })
    };
    
    // Use axios directly instead of the pre-configured instance to avoid circular dependencies
    // Add timeout and more connection options to better diagnose network issues
    const response = await axios.get(`${API_URL}/users/profile`, { 
      headers,
      timeout: 10000, // 10 second timeout
      withCredentials: true, // Include cookies if needed
      validateStatus: status => status < 500 // Don't reject on 4xx errors, only on server errors
    });
    
    if (response.status === 200) {
      const userData = response.data;
      
      // Update localStorage with the latest user data
      localStorage.setItem('user', JSON.stringify(userData));
      
      return userData;
    } else {
      throw new Error('Failed to fetch user profile');
    }
  } catch (error) {
    // Provide detailed error information for debugging
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error connecting to backend:', error.message);
      console.error('API URL being used:', API_URL);
      console.error('Make sure your backend server is running at:', apiBaseUrl);
      
      // Run comprehensive health check on the backend
      checkBackendHealth().then(isHealthy => {
        if (isHealthy) {
          console.log('Backend is reachable but the profile API call failed. This might be a CORS or authentication issue.');
          // Test CORS configuration
          testCorsConfiguration().then(corsResult => {
            if (corsResult.success) {
              console.log('CORS configuration is working correctly. The issue might be with authentication or specific to the profile endpoint.');
            } else {
              console.error('CORS test failed. You may need to check CORS configuration:', corsResult);
            }
          });
        } else {
          console.error('Backend server is not reachable. Please check if the backend is running at:', apiBaseUrl);
        }
      });
    } else {
      console.error('Error fetching user profile:', error);
    }
    
    // Fallback to localStorage if API request fails
    return getUserData();
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    // First validate token before making the request
    const tokenStatus = validateAuthToken();
    
    if (!tokenStatus.valid) {
      console.error('Invalid auth token:', tokenStatus.message);
      clearAuthData();
      throw new Error('Authentication token is invalid or expired');
    }
    
    const token = getAuthToken();
    console.log('Updating user profile with authenticated request');
    
    // Create a custom headers object with debugging info
    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Token-Debug': 'true'
    };
    
    // Use axios directly instead of the pre-configured instance
    // Add timeout and connection options to better handle network issues
    const response = await axios.put(`${API_URL}/users/profile`, profileData, { 
      headers,
      timeout: 10000, // 10 second timeout
      withCredentials: true, // Include cookies if needed
      validateStatus: status => status < 500 // Don't reject on 4xx errors, only on server errors
    });
    
    if (response.status === 200) {
      const updatedUserData = response.data;
      
      // Update localStorage with the latest user data
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      return updatedUserData;
    } else {
      throw new Error('Failed to update user profile');
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Upload profile picture to Cloudinary via backend
export const uploadProfilePicture = async (file) => {
  try {
    // First validate token before making the request
    const tokenStatus = validateAuthToken();
    
    if (!tokenStatus.valid) {
      console.error('Invalid auth token:', tokenStatus.message);
      clearAuthData();
      throw new Error('Authentication token is invalid or expired');
    }
    
    const token = getAuthToken();
    console.log('Uploading profile picture with authenticated request');
    
    // Create form data
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    // Create a custom headers object with debugging info
    const headers = {
      'Authorization': `Bearer ${token}`,
      'X-Token-Debug': 'true',
      // Do not set Content-Type here, let the browser set it with proper boundary for FormData
    };
    
    // Use axios directly instead of the pre-configured instance
    // Add timeout and connection options to better handle network issues
    const response = await axios.post(`${API_URL}/users/upload-profile-picture`, formData, { 
      headers,
      timeout: 20000, // 20 second timeout for file uploads
      withCredentials: true, // Include cookies if needed
      validateStatus: status => status < 500, // Don't reject on 4xx errors, only on server errors
      // Special headers for form data upload
      onUploadProgress: progressEvent => {
        console.log(`Upload progress: ${Math.round((progressEvent.loaded * 100) / progressEvent.total)}%`);
      }
    });
    
    if (response.status === 200) {
      const { profile_picture_url } = response.data;
      
      // Update user data in localStorage
      const userData = getUserData() || {};
      const updatedUserData = {
        ...userData,
        profile_picture_url
      };
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      return profile_picture_url;
    } else {
      throw new Error('Failed to upload profile picture');
    }
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};