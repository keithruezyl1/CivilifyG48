import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/landing";
import Chat from "./pages/chat";
import SignIn from "./pages/signin";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgotpassword";
import VerifyCode from "./pages/verifycode";
import ResetPassword from "./pages/resetpassword";
import CivilifyDocuments from "./pages/CivilifyDocuments"
import EditProfile from "./pages/editprofile";
import Profile from "./pages/profile";
import DiagnosticsPage from "./pages/diagnostics";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-code" element={<VerifyCode />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/civilify-documents" element={<CivilifyDocuments />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/diagnostics" element={<DiagnosticsPage />} />

    </Routes>
  );
};

export default AppRoutes;
