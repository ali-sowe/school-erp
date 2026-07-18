import { query } from "../../database/query.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { AUTH_MESSAGES } from "../../constants/messages/auth.message.js";

// Find user 
export const findUserByEmail = async (email) => {
    const users = await query(`
        SELECT u.id,
        u.school_id,
        u.user_code,
        u.first_name,
        u.last_name,
        u.email,
        u.password,
        u.status,
        r.role_name,
        r.permissions
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.email = ?
        LIMIT 1
    `, [email]);
    
    return users[0];
};

// Same shape as findUserByEmail (role_name joined in, password included so
// the caller can sensitize consistently) — used by GET /auth/me so a page
// refresh shows the same user detail the login response did, not just the
// bare JWT payload.
export const findUserById = async (id) => {
    const users = await query(`
        SELECT u.id,
        u.school_id,
        u.user_code,
        u.first_name,
        u.last_name,
        u.email,
        u.password,
        u.status,
        r.role_name,
        r.permissions
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.id = ?
        LIMIT 1
    `, [id]);

    return users[0];
};


// validate the user
export const validateUser = (user) => {
    if (!user) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    if (user.status !== 'active') {
        throw new AppError(HTTP_STATUS.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_INACTIVE);
    }
};


// Update last login timestamp
export const updateLastLogin = async (userId) => {
    await query(`UPDATE users SET last_login = NOW() WHERE id = ?`, [userId]);
};


// Sensitize the user object
export const sensitizeUser = (user) => {
    const safeUser = { ...user};

    delete safeUser.password;

    return safeUser;
};