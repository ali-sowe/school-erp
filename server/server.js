import http from 'http';
import app from './app.js';
import env from './config/env.js';
import { testConnection } from './database/test-connection.js';
import { seedAdministrator } from './services/auth/auth.service.js';

const PORT = env.port;

const startServer = async () => {
    try {
        await testConnection();
        await seedAdministrator();

        const server = http.createServer(app);
        server.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();