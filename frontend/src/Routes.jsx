import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/landing';
import Chat from './pages/chat';
import Login from './pages/login';
import Signup from './pages/signup';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  );
};

export default AppRoutes;
