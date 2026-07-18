import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import App from '../App';
import AdminDashboard from '../pages/AdminDashboard';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
