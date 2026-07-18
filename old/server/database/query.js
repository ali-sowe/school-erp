import { pool } from './connection.js';

export const query = async (sql, values = []) => {
    const [rows] = await pool.execute(sql, values);
    return rows;
    /*
        Now anywhere in the project:
        const users = await query('SELECT * FROM users where email = ?', [email]);
    */
};
