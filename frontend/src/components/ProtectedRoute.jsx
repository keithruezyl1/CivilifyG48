import { Navigate, useLocation } from 'react-router-dom';
import { validateAuthToken, getAuthToken } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = getAuthToken();
  const authStatus = validateAuthToken();
  
  console.log('ProtectedRoute check:', {
    path: location.pathname,
    hasToken: !!token,
    authStatus
  });
  
  if (!token || !authStatus.valid) {
    console.log('Authentication failed, redirecting to login');
    // Store the current location to redirect back after login
    localStorage.setItem('redirectAfterLogin', location.pathname);
    // Clear any existing auth data
    localStorage.removeItem('authToken');
    localStorage.removeItem('tokenExpires');
    localStorage.removeItem('user');
    localStorage.removeItem('profileData');
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute; 