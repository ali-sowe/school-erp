import { AppError } from '../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../constants/httpstatus.js';
import { USER_MESSAGES } from '../../constants/messages/user.message.js';
import * as userRepository from '../../repositories/user/user.repository.js';
import { hashPassword } from '../../helpers/password.helper.js';
import { generateCode } from '../../helpers/code-generator.helper.js';

export async function createUser(data) {
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
        throw new AppError(HTTP_STATUS.CONFLICT, USER_MESSAGES.DUPLICATE_EMAIL);
    }

    const passwordHash = await hashPassword(data.password);

    const id = await userRepository.create({
        ...data,
        password: passwordHash,
        user_code: data.user_code || generateCode('USR', Date.now()),
        status: data.status || 'active'
    });

    return await userRepository.findById(id);
}

export async function getUsers() {
    return await userRepository.findAll();
}

export async function getUserById(id) {
    const user = await userRepository.findById(id);

    if (!user) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
    }

    return user;
}

export async function updateUser(id, data) {
    const user = await userRepository.findById(id);

    if (!user) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
    }

    if (data.password) {
        data.password = await hashPassword(data.password);
    }

    await userRepository.update(id, data);
    return await userRepository.findById(id);
}

export async function deleteUser(id) {
    const user = await userRepository.findById(id);

    if (!user) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
    }

    await userRepository.remove(id);
    return { id };
}
