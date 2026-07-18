import { query } from '../../database/query.js';
import { AppError } from '../../helpers/app-error.helper.js';
import { generateCode } from '../../helpers/code-generator.helper.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { AUTH_MESSAGES } from '../../constants/messages/auth.message.js';
import { hashPassword, comparePassword } from '../../helpers/password.helper.js';
import { generateToken } from '../../helpers/jwt.helper.js';
import * as authRepository from '../../repositories/auth/auth.repository.js';
import { DEFAULT_ROLE_PERMISSIONS, normalizePermissions } from '../../helpers/auth/permission.helper.js';


export const seedAdministrator = async () => {
    // Step 1
    const existingAdmin = await query(`SELECT id FROM users WHERE role_id = (SELECT id FROM roles WHERE role_name = ?) LIMIT 1`, ['Administrator']);

    if (existingAdmin.length > 0) {
        console.log('✅ Administrator already exists. Skipping creation.');
        return;
    }

    // Step 2
    const hashedPassword = await hashPassword('Admin@123');

    // Step 3
    await query(`INSERT INTO users (user_code, first_name, last_name, email, password, role_id) VALUES (?, ?, ?, ?, ?, (SELECT id FROM roles WHERE role_name = ?))`, [generateCode('USR', 1), 'System', 'Administrator', 'admin@schoolerp.com', hashedPassword, 'Administrator']);
    console.log('🎉 Administrator created successfully.');
}


export const login = async ({ email, password }) => {
    // Step 1: Find user 
    const user = await authRepository.findUserByEmail(email);

    // validate the user
    authRepository.validateUser(user);


    // Step 3: Compare password
    const passwordMatches = await comparePassword(password, user.password);
    if (!passwordMatches) {
        throw new AppError(HTTP_STATUS.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    // step 4: Update last login timestamp
    authRepository.updateLastLogin(user.id);

    // Step 5: Generate JWT token
    const permissions = normalizePermissions(
        DEFAULT_ROLE_PERMISSIONS[user.role_name] || []
    );
    const token = generateToken({ userId: user.id, email: user.email, role: user.role_name, permissions });
    
    return { token, user: { ...authRepository.sensitizeUser(user), permissions } };
}

export const logout = async (userId) => {
    if (!userId) {
        return { message: AUTH_MESSAGES.LOGOUT_SUCCESS };
    }

    return { message: AUTH_MESSAGES.LOGOUT_SUCCESS };
}