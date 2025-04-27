import { Routes, Route } from "react-router-dom";
import Landing from "./pages/landing";
import Chat from "./pages/chat";
import SignIn from "./pages/signin";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgotpassword";
import ResetPassword from "./pages/resetpassword";
import CivilifyDocuments from "./pages/civilifydocuments";
import Profile from "./pages/profile";
import EditProfile from "./pages/editprofile";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/civilify-documents" element={<CivilifyDocuments />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/edit-profile" element={<EditProfile />} />
    </Routes>
  );
};

export default AppRoutes;
