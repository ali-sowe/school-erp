import { query } from "../../database/query.js";
import { transaction } from "../../database/transaction.js";

export async function create(data) {
    const results = await query(`INSERT INTO academic_years (name, start_date, end_date) VALUES (?,?,?)`, [data.name, data.start_date, data.end_date]);

    return results.insertId;
}

export async function findById(id) {
    const rows = await query(`SELECT * FROM academic_years WHERE id = ?`, [id]);

    return rows[0] || null;
}


export async function findByName(name) {
    const rows = await query(`SELECT * FROM academic_years WHERE name = ?`, [name]);
    
    return rows[0] || null;
}


export async function findAll() {
    return await query(`SELECT * FROM academic_years ORDER BY start_date DESC`);
}

export async function update(id, data) {
    await query(`UPDATE academic_years SET name = ?, start_date = ?, end_date = ? WHERE id = ?`, [data.name, data.start_date, data.end_date, id]);

    // Returns nothing because the service already returns the updated object
}


export async function findActive() {}

export async function activate(id) {
    await transaction(async (connection) => {
        // Deactivate THE CURRENT ACTIVE academic year
        await connection.query(`UPDATE academic_years SET status = 'DRAFT' WHERE status = 'ACTIVE'`);
        
        // Activate the specified academic year
        await connection.query(`UPDATE academic_years SET status = 'ACTIVE' WHERE id = ?`, [id]);

    });
}


export async function close(id) {
    await query(`UPDATE academic_years SET status = 'CLOSED' WHERE id = ?`, [id]);
}