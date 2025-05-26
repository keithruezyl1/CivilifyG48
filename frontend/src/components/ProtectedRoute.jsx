import { Navigate, useLocation } from 'react-router-dom';
import { validateAuthToken, getAuthToken } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = getAuthToken();
  const authStatus = validateAuthToken();
  
  // Get user data to check role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'ROLE_ADMIN';
  const currentPath = location.pathname;
  
  console.log('ProtectedRoute check:', {
    path: currentPath,
    hasToken: !!token,
    authStatus,
    isAdmin
  });
  
  // Handle authentication check
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
  
  // Role-based access control
  if (isAdmin) {
    // Admin users can only access admin and edit-profile pages
    const allowedAdminPaths = ['/admin', '/edit-profile'];
    if (!allowedAdminPaths.includes(currentPath)) {
      console.log('Admin attempted to access unauthorized page:', currentPath);
      return <Navigate to="/admin" replace />;
    }
  } else {
    // Regular users cannot access admin page
    if (currentPath === '/admin') {
      console.log('Regular user attempted to access admin page');
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;