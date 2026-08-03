import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { RealtimeProvider } from '../context/RealtimeContext';
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
import LibraryPage from '../pages/library/LibraryPage';
import BookDetailPage from '../pages/library/BookDetailPage';
import ApprovalsPage from '../pages/approvals/ApprovalsPage';
import ApprovalRequestDetailPage from '../pages/approvals/ApprovalRequestDetailPage';
import ExpensesPage from '../pages/expenses/ExpensesPage';
import ExpenseDetailPage from '../pages/expenses/ExpenseDetailPage';
import LeaveRequestsPage from '../pages/leave-requests/LeaveRequestsPage';
import LeaveRequestDetailPage from '../pages/leave-requests/LeaveRequestDetailPage';
import ConversationsPage from '../pages/communication/ConversationsPage';
import AnnouncementsPage from '../pages/communication/AnnouncementsPage';
import AcademicCalendarPage from '../pages/academic-calendar/AcademicCalendarPage';

function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
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
              path="/library"
              element={
                <ProtectedRoute permission="library.read">
                  <LibraryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/library/books/:id"
              element={
                <ProtectedRoute permission="library.read">
                  <BookDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals"
              element={
                <ProtectedRoute permission="approvals.read">
                  <ApprovalsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals/:id"
              element={
                <ProtectedRoute permission="approvals.read">
                  <ApprovalRequestDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute permission="expenses.read">
                  <ExpensesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses/:id"
              element={
                <ProtectedRoute permission="expenses.read">
                  <ExpenseDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave-requests"
              element={
                <ProtectedRoute permission="leave-requests.read">
                  <LeaveRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leave-requests/:id"
              element={
                <ProtectedRoute permission="leave-requests.read">
                  <LeaveRequestDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/academic-calendar"
              element={
                <ProtectedRoute permission="academic-years.read">
                  <AcademicCalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conversations"
              element={
                <ProtectedRoute permission="messaging.read">
                  <ConversationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <ProtectedRoute permission="announcements.read">
                  <AnnouncementsPage />
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
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;
