import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
    'PORT',
    'NODE_ENV',
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
];

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const env = {
    port: Number(process.env.PORT),
    nodeEnv: process.env.NODE_ENV,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    db: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME,
    },
    corsOrigin: process.env.CORS_ORIGIN,
    uploads: {
        // Not in requiredEnvVars — deliberately optional so existing .env
        // files keep working; these are storage tuning knobs, not secrets.
        dir: process.env.UPLOAD_DIR || './uploads',
        maxFileSizeMb: Number(process.env.MAX_UPLOAD_SIZE_MB) || 25,
    },
    // Also deliberately optional. Without SMTP configured, mailer.helper.js
    // logs the email instead of sending it, so password reset still works
    // end-to-end in development/self-hosted setups that haven't wired up
    // email yet — same "fail soft, never block the feature" reasoning as
    // document-preview.helper.js when LibreOffice isn't installed.
    mail: {
        host: process.env.SMTP_HOST || null,
        port: Number(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER || null,
        password: process.env.SMTP_PASSWORD || null,
        fromAddress: process.env.MAIL_FROM || 'no-reply@school-erp.local',
    },
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    // Deliberately optional, same reasoning as uploads/mail above — a
    // sensible default so existing .env files keep working unmodified.
    refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 30,
};

export default env;