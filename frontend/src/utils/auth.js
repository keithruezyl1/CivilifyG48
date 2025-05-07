// src/utils/auth.js
import axios from 'axios';

// API URL for the backend
const API_URL = 'http://localhost:8081/api';

// Get the stored authentication token
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
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
    const token = getAuthToken();
    console.log("fetchUserProfile token:", token ? "Token exists" : "No token");
    
    if (!token) {
      console.error('No auth token found');
      return getUserData(); // Return local data if no token
    }
    
    // Get user data from the backend
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
    console.error('Error fetching user profile:', error);
    
    // Fallback to localStorage if API request fails
    return getUserData();
  }
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const response = await axios.put(`${API_URL}/users/profile`, profileData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
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
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No auth token found');
    }
    
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const response = await axios.post(`${API_URL}/users/upload-profile-picture`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
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