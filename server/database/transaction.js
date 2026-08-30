import { pool } from './connection.js';

export const transaction = async (callback) => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const results = await callback(connection);

        await connection.commit();

        return results;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

// This function wraps database operations in a transaction.