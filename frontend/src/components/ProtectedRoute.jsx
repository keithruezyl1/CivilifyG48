import { Navigate, useLocation } from "react-router-dom";
import { validateAuthToken, getAuthToken } from "../utils/auth";

// requiredRole can be 'USER' | 'ADMIN' | 'SYSTEM_ADMIN'
const ProtectedRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  const token = getAuthToken();
  const authStatus = validateAuthToken();

  // Get user data to check role
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = (user.role || "").toString();
  const isAdmin = role === "ROLE_ADMIN" || role === "ADMIN";
  const isSystemAdmin = role === "ROLE_SYSTEM_ADMIN" || role === "SYSTEM_ADMIN";
  const currentPath = location.pathname;

  console.log("ProtectedRoute check:", {
    path: currentPath,
    hasToken: !!token,
    authStatus,
    isAdmin,
  });

  // Handle authentication check
  if (!token || !authStatus.valid) {
    console.log("Authentication failed, redirecting to login");
    // Store the current location to redirect back after login
    localStorage.setItem("redirectAfterLogin", location.pathname);
    // Clear any existing auth data
    localStorage.removeItem("authToken");
    localStorage.removeItem("tokenExpires");
    localStorage.removeItem("user");
    localStorage.removeItem("profileData");
    return <Navigate to="/signin" replace />;
  }

  // Role-based access control
  if (requiredRole) {
    const hasRequired =
      (requiredRole === "USER" &&
        (role === "ROLE_USER" || isAdmin || isSystemAdmin)) ||
      (requiredRole === "ADMIN" && (isAdmin || isSystemAdmin)) ||
      (requiredRole === "SYSTEM_ADMIN" && isSystemAdmin);
    if (!hasRequired) {
      return <Navigate to="/404" replace />;
    }
  } else {
    // Default restrictions for admin path
    if (currentPath.startsWith("/admin") && !(isAdmin || isSystemAdmin)) {
      return <Navigate to="/404" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
