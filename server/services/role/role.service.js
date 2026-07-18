import { AppError } from '../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import * as roleRepository from '../../repositories/role/role.repository.js';

export async function getRoles() {
    return await roleRepository.findAll();
}

export async function getRoleById(id) {
    const role = await roleRepository.findById(id);

    if (!role) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, 'Role not found.');
    }

    return role;
}

export async function createRole(data) {
    const existing = await roleRepository.findByName(data.role_name);

    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, 'Role already exists.');
    }

    const id = await roleRepository.create(data);
    return await roleRepository.findById(id);
}

export async function updateRole(id, data) {
    const role = await roleRepository.findById(id);

    if (!role) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, 'Role not found.');
    }

    await roleRepository.update(id, data);
    return await roleRepository.findById(id);
}

export async function deleteRole(id) {
    const role = await roleRepository.findById(id);

    if (!role) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, 'Role not found.');
    }

    await roleRepository.remove(id);
    return { id };
}
