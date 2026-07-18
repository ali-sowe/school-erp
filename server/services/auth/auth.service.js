import { AppError } from '../../helpers/app-error.helper.js';
import { generateCode } from '../../helpers/code-generator.helper.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { AUTH_MESSAGES } from '../../constants/messages/auth.message.js';
import { hashPassword, comparePassword } from '../../helpers/password.helper.js';
import { generateToken } from '../../helpers/jwt.helper.js';
import * as authRepository from '../../repositories/auth/auth.repository.js';
import * as roleRepository from '../../repositories/role/role.repository.js';
import * as userRepository from '../../repositories/user/user.repository.js';
import { DEFAULT_ROLE_PERMISSIONS, normalizePermissions } from '../../helpers/auth/permission.helper.js';

const PLATFORM_ADMIN_ROLE_NAME = 'Platform Administrator';
const PLATFORM_ADMIN_EMAIL = 'admin@schoolerp.com';

// Bootstraps the one account that can create schools in the first place —
// school_id NULL means "platform level", not "belongs to no school" (see
// migration 005). Every other Administrator is created per-school, as part
// of school onboarding (see school.service.js).
export const seedPlatformAdministrator = async () => {
    const existingAdmin = await userRepository.findByEmail(PLATFORM_ADMIN_EMAIL);

    if (existingAdmin) {
        console.log('✅ Platform Administrator already exists. Skipping creation.');
        return;
    }

    let role = await roleRepository.findByName(null, PLATFORM_ADMIN_ROLE_NAME);

    if (!role) {
        const roleId = await roleRepository.create({
            school_id: null,
            role_name: PLATFORM_ADMIN_ROLE_NAME,
            description: 'Manages schools on the platform. Not tied to any single school.'
        });
        role = await roleRepository.findById(roleId);
    }

    const hashedPassword = await hashPassword('Admin@123');

    await userRepository.create({
        school_id: null,
        user_code: generateCode('USR', 1),
        first_name: 'Platform',
        last_name: 'Administrator',
        email: PLATFORM_ADMIN_EMAIL,
        password: hashedPassword,
        role_id: role.id,
        status: 'active'
    });

    console.log('🎉 Platform Administrator created successfully.');
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
    const token = generateToken({
        userId: user.id,
        schoolId: user.school_id,
        email: user.email,
        role: user.role_name,
        permissions
    });
    
    return { token, user: { ...authRepository.sensitizeUser(user), permissions } };
}

// req.user is only the decoded JWT payload (userId, schoolId, email, role,
// permissions) — it does not carry first_name/last_name/role_name, so
// GET /auth/me looks the user back up rather than echoing the token as-is.
export const getCurrentUser = async (userId) => {
    const user = await authRepository.findUserById(userId);
    authRepository.validateUser(user);

    const permissions = normalizePermissions(
        DEFAULT_ROLE_PERMISSIONS[user.role_name] || []
    );

    return { ...authRepository.sensitizeUser(user), permissions };
}

export const logout = async (userId) => {
    if (!userId) {
        return { message: AUTH_MESSAGES.LOGOUT_SUCCESS };
    }

    return { message: AUTH_MESSAGES.LOGOUT_SUCCESS };
}
