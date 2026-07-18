import * as roleService from '../../services/role/role.service.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';

export const createRole = asyncHandler(async (req, res) => {
    const role = await roleService.createRole(req.body);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Role created successfully.',
        data: role
    });
});

export const getRoles = asyncHandler(async (req, res) => {
    const roles = await roleService.getRoles();

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Roles retrieved successfully.',
        data: roles
    });
});

export const getRoleById = asyncHandler(async (req, res) => {
    const role = await roleService.getRoleById(req.params.id);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Role retrieved successfully.',
        data: role
    });
});

export const updateRole = asyncHandler(async (req, res) => {
    const role = await roleService.updateRole(req.params.id, req.body);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Role updated successfully.',
        data: role
    });
});

export const deleteRole = asyncHandler(async (req, res) => {
    const result = await roleService.deleteRole(req.params.id);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Role deleted successfully.',
        data: result
    });
});
