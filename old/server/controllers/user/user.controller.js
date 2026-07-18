import * as userService from '../../services/user/user.service.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { HTTP_STATUS } from '../../constants/httpstatus.js';
import { USER_MESSAGES } from '../../constants/messages/user.message.js';

export const createUser = asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: USER_MESSAGES.CREATED,
        data: user
    });
});

export const getUsers = asyncHandler(async (req, res) => {
    const users = await userService.getUsers();

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: USER_MESSAGES.FETCHED_ALL,
        data: users
    });
});

export const getUserById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.params.id);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: USER_MESSAGES.FETCHED,
        data: user
    });
});

export const updateUser = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: USER_MESSAGES.UPDATED,
        data: user
    });
});

export const deleteUser = asyncHandler(async (req, res) => {
    const result = await userService.deleteUser(req.params.id);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: USER_MESSAGES.DELETED,
        data: result
    });
});
