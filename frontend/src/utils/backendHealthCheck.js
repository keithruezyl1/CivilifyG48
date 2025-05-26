// backendHealthCheck.js - Utility to check backend connectivity
import axios from 'axios';

// Get the API base URL from environment variables or use default
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';

/**
 * Check if the backend server is available
 * @returns {Promise<boolean>} True if the backend is reachable, false otherwise
 */
export const checkBackendHealth = async () => {
  try {
    console.log('Checking backend health at:', `${apiBaseUrl}/health`);
    
    // Set a short timeout to quickly detect connection issues
    const response = await axios.get(`${apiBaseUrl}/health`, {
      timeout: 5000,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    console.log('Backend health check response:', response.status, response.data);
    return response.status === 200;
  } catch (error) {
    console.error('Backend health check failed:', error.message);
    
    // Additional diagnostics for network errors
    if (error.code === 'ERR_NETWORK') {
      console.error('Network error details:', {
        url: `${apiBaseUrl}/health`,
        errorCode: error.code,
        errorName: error.name,
        message: error.message
      });
      
      // Try a fetch-based fallback with no-cors mode as last resort
      try {
        console.log('Attempting fallback connectivity test with fetch/no-cors...');
        const fetchResponse = await fetch(`${apiBaseUrl}/health`, {
          method: 'GET',
          mode: 'no-cors', // This might help with CORS issues
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        // If we get here, we at least got a response from the server
        console.log('Fetch connectivity test completed, got response:', fetchResponse);
        return true;
      } catch (fetchError) {
        console.error('Fetch connectivity test also failed:', fetchError);
        return false;
      }
    }
    
    return false;
  }
};

/**
 * Test CORS configuration between frontend and backend
 * @returns {Promise<Object>} Response data if successful, error details if not
 */
export const testCorsConfiguration = async () => {
  try {
    console.log('Testing CORS configuration at:', `${apiBaseUrl}/api/cors-test`);
    
    const response = await axios.get(`${apiBaseUrl}/api/cors-test`, {
      timeout: 5000,
      headers: {
        'X-Test-Header': 'testing-cors',
        'Authorization': 'Bearer test-token'
      }
    });
    
    console.log('CORS test successful:', response.data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('CORS test failed:', error.message);
    return {
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN',
      details: error.response ? error.response.data : 'No response details available'
    };
  }
};
