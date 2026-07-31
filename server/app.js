import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import env from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth/auth.routes.js';
import academicYearRoutes from './routes/academic-year/academic-year.routes.js';
import termRoutes from './routes/term/term.routes.js';
import schoolRoutes from './routes/school/school.routes.js';
import userRoutes from './routes/user/user.routes.js';
import roleRoutes from './routes/role/role.routes.js';
import gradeLevelRoutes from './routes/grade-level/grade-level.routes.js';
import subjectRoutes from './routes/subject/subject.routes.js';
import classRoutes from './routes/class/class.routes.js';
import studentRoutes from './routes/student/student.routes.js';
import guardianRoutes from './routes/guardian/guardian.routes.js';
import attendanceRoutes from './routes/attendance/attendance.routes.js';
import teacherRoutes from './routes/teacher/teacher.routes.js';
import teacherSubjectAssignmentRoutes from './routes/teacher/teacher-subject-assignment.routes.js';
import classTeacherAssignmentRoutes from './routes/teacher/class-teacher-assignment.routes.js';
import feeStructureRoutes from './routes/finance/fee-structure.routes.js';
import invoiceRoutes from './routes/finance/invoice.routes.js';
import paymentRoutes from './routes/finance/payment.routes.js';
import examRoutes from './routes/exam/exam.routes.js';
import examResultRoutes from './routes/exam/exam-result.routes.js';
import conversationRoutes from './routes/messaging/conversation.routes.js';
import announcementRoutes from './routes/messaging/announcement.routes.js';
import notificationRoutes from './routes/notification/notification.routes.js';
import libraryBookRoutes from './routes/library/book.routes.js';
import libraryCopyRoutes from './routes/library/copy.routes.js';
import libraryBorrowRoutes from './routes/library/borrow.routes.js';
import approvalRoutes from './routes/approval/approval.routes.js';
import documentRoutes from './routes/document/document.routes.js';
import dataImportRoutes from './routes/data-import/import-batch.routes.js';
import leaveRequestRoutes from './routes/leave/leave-request.routes.js';
import reportRoutes from './routes/report/report.routes.js';
import portalRoutes from './routes/portal/portal.routes.js';
import expenseCategoryRoutes from './routes/expense/expense-category.routes.js';
import expenseRoutes from './routes/expense/expense.routes.js';
import calendarRoutes from './routes/calendar/calendar.routes.js';

import { notFound } from './middleware/error/not-found.js';
import { errorHandler } from './middleware/error/error-handler.js';

const app = express();

app.use(helmet()); // Security middleware
app.use(cors({ origin: env.corsOrigin, credentials: true })); // Enable CORS, allow the auth cookie to be sent
app.use(morgan('dev')); // HTTP request logger
app.use(cookieParser()); // Cookie parsing
app.use(express.json()); // Parse JSON bodies


// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/terms', termRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/grade-levels', gradeLevelRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/teacher-subject-assignments', teacherSubjectAssignmentRoutes);
app.use('/api/class-teacher-assignments', classTeacherAssignmentRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/exam-results', examResultRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/library/books', libraryBookRoutes);
app.use('/api/library/copies', libraryCopyRoutes);
app.use('/api/library/borrow-records', libraryBorrowRoutes);
app.use('/api/approval-requests', approvalRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/data-imports', dataImportRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/calendar-events', calendarRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to the School ERP API',
        version: '1.0.0',
    })
});


// Must be last
app.use(notFound); // Handle 404 errors
app.use(errorHandler); // Handle other errors


export default app;