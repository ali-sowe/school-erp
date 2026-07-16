import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth/auth.routes.js';
import academicYearRoutes from './routes/academic-year/academic-year.routes.js';
import userRoutes from './routes/user/user.routes.js';
import roleRoutes from './routes/role/role.routes.js';

import { notFound } from './middleware/error/not-found.js';
import { errorHandler } from './middleware/error/error-handler.js';

const app = express();

app.use(helmet()); // Security middleware
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // HTTP request logger
app.use(cookieParser()); // Cookie parsing
app.use(express.json()); // Parse JSON bodies


// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);

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