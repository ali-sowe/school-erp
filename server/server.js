import http from 'http';
import app from './app.js';
import { testConnection } from './database/test-connection.js';
import { seedAdministrator } from './services/auth/auth.service.js';

const PORT = process.env.PORT || 5000;

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