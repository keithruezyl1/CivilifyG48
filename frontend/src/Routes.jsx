import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/landing";
import Chat from "./pages/chat";
import SignIn from "./pages/signin";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgotpassword";
import VerifyCode from "./pages/verifycode";
import ResetPassword from "./pages/resetpassword";
import CivilifyDocuments from "./pages/CivilifyDocuments";
import EditProfile from "./pages/editprofile";
import Profile from "./pages/profile";
import DiagnosticsPage from "./pages/diagnostics";
import Admin from "./pages/admin";
import AdminKnowledgeBase from "./pages/admin/knowledge-base";
import SystemAdminPage from "./pages/system";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingScreen from "./pages/LoadingScreen";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route path="/loading" element={<LoadingScreen />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-code" element={<VerifyCode />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/civilify-documents" element={<CivilifyDocuments />} />
      <Route
        path="/edit-profile"
        element={
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/diagnostics" element={<DiagnosticsPage />} />
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="ADMIN">
          <Admin />
        </ProtectedRoute>
      } />
      <Route path="/admin/knowledge-base" element={
        <ProtectedRoute requiredRole="ADMIN">
          <AdminKnowledgeBase />
        </ProtectedRoute>
      } />
      <Route path="/system" element={
        <ProtectedRoute requiredRole="SYSTEM_ADMIN">
          <SystemAdminPage />
        </ProtectedRoute>
      } />
      <Route path="/unauthorized" element={<div style={{padding:20}}>Unauthorized</div>} />
    </Routes>
  );
};
const styles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    backdropFilter: "blur(8px)",
    animation: "fadeIn 0.3s ease-out",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "32px",
    animation: "slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  logoContainer: {
    animation: "logoEntrance 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    filter: "drop-shadow(0 4px 12px rgba(243, 77, 1, 0.2))",
  },
  logo: {
    width: "80px",
    height: "80px",
    animation:
      "logoBreatheAndLoad 3s ease-in-out infinite, logoOpacityLoad 3s ease-in-out infinite",
  },
  loadingText: {
    fontSize: "16px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
};

// Inject CSS into the document
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes logoEntrance {
    0% { opacity: 0; transform: scale(0.5) rotate(-10deg); }
    60% { transform: scale(1.1) rotate(5deg); }
    100% { opacity: 1; transform: scale(1) rotate(0deg); }
  }

  @keyframes logoBreatheAndLoad {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }

  @keyframes logoOpacityLoad {
    0% { opacity: 0.3; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }

  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: translateY(20px) scale(0.8);
    }
    60% {
      opacity: 1;
      transform: translateY(-10px) scale(1.1);
    }
    100% {
      transform: translateY(0) scale(1);
    }
  }

  @keyframes bounceDot {
    0% {
      opacity: 0;
      transform: translateY(0);
    }
    30% {
      opacity: 1;
      transform: translateY(-6px);
    }
    60% {
      transform: translateY(2px);
    }
    100% {
      opacity: 0;
      transform: translateY(0);
    }
  }

  .bounce-letter {
    display: inline-block;
    animation: bounceIn 0.6s ease-out forwards;
  }

  .bounce-dot {
    display: inline-block;
    color: #F34D01;
    font-weight: bold;
    animation: bounceDot 1.5s ease-in-out infinite;
  }
`;
document.head.appendChild(styleSheet);
export default AppRoutes;
