import { AppError } from '../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import * as roleRepository from '../../repositories/role/role.repository.js';
import * as userRepository from '../../repositories/user/user.repository.js';
import { normalizePermissions } from '../../helpers/auth/permission.helper.js';

export async function getRoles(schoolId) {
    return await roleRepository.findAll(schoolId);
}

export async function getRoleById(id, schoolId) {
    const role = await roleRepository.findById(id);

    if (!role || role.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, 'Role not found.');
    }

    return role;
}

export async function createRole(data, schoolId) {
    const existing = await roleRepository.findByName(schoolId, data.role_name);

    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, 'Role already exists.');
    }

    const id = await roleRepository.create({
        ...data,
        school_id: schoolId,
        permissions: normalizePermissions(data.permissions)
    });
    return await roleRepository.findById(id);
}

export async function updateRole(id, data, schoolId) {
    const role = await getRoleById(id, schoolId);

    const updateData = { ...data };
    if (data.permissions !== undefined) {
        updateData.permissions = normalizePermissions(data.permissions);
    }

    await roleRepository.update(role.id, updateData);
    return await roleRepository.findById(role.id);
}

export async function deleteRole(id, schoolId) {
    const role = await getRoleById(id, schoolId);

    // A role still assigned to someone can't be deleted — that would leave
    // their user row pointing at a role_id that no longer exists, breaking
    // every permission check for them at their next login. Reassign or
    // deactivate those users first.
    const usersWithRole = await userRepository.countByRoleId(role.id);
    if (usersWithRole > 0) {
        throw new AppError(
            HTTP_STATUS.BAD_REQUEST,
            `This role is still assigned to ${usersWithRole} user${usersWithRole === 1 ? '' : 's'}. Reassign them to a different role first.`
        );
    }

    await roleRepository.remove(role.id);
    return { id: role.id };
}
