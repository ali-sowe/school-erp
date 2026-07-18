import { AppError } from '../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import * as roleRepository from '../../repositories/role/role.repository.js';

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

    const id = await roleRepository.create({ ...data, school_id: schoolId });
    return await roleRepository.findById(id);
}

export async function updateRole(id, data, schoolId) {
    const role = await getRoleById(id, schoolId);

    await roleRepository.update(role.id, data);
    return await roleRepository.findById(role.id);
}

export async function deleteRole(id, schoolId) {
    const role = await getRoleById(id, schoolId);

    await roleRepository.remove(role.id);
    return { id: role.id };
}
