import dotenv from 'dotenv';

dotenv.config();

const env = {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        name: process.env.DB_NAME
    },
    corsOrigin: process.env.CORS_ORIGIN
};

export default env;