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
import GuardianDetailPage from '../pages/guardians/GuardianDetailPage';
import AttendancePage from '../pages/attendance/AttendancePage';
import ClassesPage from '../pages/classes/ClassesPage';
import ClassDetailPage from '../pages/classes/ClassDetailPage';
import TeachersListPage from '../pages/teachers/TeachersListPage';
import TeacherDetailPage from '../pages/teachers/TeacherDetailPage';
import ExamsListPage from '../pages/exams/ExamsListPage';
import ExamDetailPage from '../pages/exams/ExamDetailPage';
import FinancePage from '../pages/finance/FinancePage';
import InvoiceDetailPage from '../pages/finance/InvoiceDetailPage';

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
              path="/guardians/:id"
              element={
                <ProtectedRoute permission="guardians.read">
                  <GuardianDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute permission="attendance.read">
                  <AttendancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes"
              element={
                <ProtectedRoute permission="classes.read">
                  <ClassesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes/:id"
              element={
                <ProtectedRoute permission="classes.read">
                  <ClassDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers"
              element={
                <ProtectedRoute permission="teachers.read">
                  <TeachersListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers/:id"
              element={
                <ProtectedRoute permission="teachers.read">
                  <TeacherDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exams"
              element={
                <ProtectedRoute permission="exams.read">
                  <ExamsListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/exams/:id"
              element={
                <ProtectedRoute permission="exams.read">
                  <ExamDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance"
              element={
                <ProtectedRoute permission="finance.read">
                  <FinancePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/finance/invoices/:id"
              element={
                <ProtectedRoute permission="finance.read">
                  <InvoiceDetailPage />
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
