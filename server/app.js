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