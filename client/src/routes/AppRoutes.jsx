import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import AppLayout from '../components/AppLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import AdminDashboard from '../pages/AdminDashboard';
import StudentsListPage from '../pages/students/StudentsListPage';
import StudentDetailPage from '../pages/students/StudentDetailPage';
import GuardiansListPage from '../pages/guardians/GuardiansListPage';

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route
              path="/students"
              element={
                <ProtectedRoute permission="students.read">
                  <StudentsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/students/:id"
              element={
                <ProtectedRoute permission="students.read">
                  <StudentDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/guardians"
              element={
                <ProtectedRoute permission="guardians.read">
                  <GuardiansListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute permission="users.read">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;
