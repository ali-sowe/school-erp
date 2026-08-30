import { pool } from './connection.js';

export const testConnection = async () => {
    const connection = await pool.getConnection();
    try {
        await connection.ping();
        console.log('✅ MySQL connected successfully');
    } catch (error) {
        console.error('❌ MySQL connection failed:', error);
        throw error;
    } finally {
        connection.release();
    }
};