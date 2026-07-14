import { sendSuccess } from '../../helpers/response.helper.js';
import * as authService from '../../services/auth/auth.service.js';
import { AUTH_MESSAGES } from '../../constants/messages/auth.message.js';

export const login = async (req, res) => {
    const user = await authService.login(req.body);
    return sendSuccess(res, { message: AUTH_MESSAGES.LOGIN_SUCCESS, data: user });
}

export const me = async (req, res) => {
    return sendSuccess(res, { message: AUTH_MESSAGES.ME_SUCCESS, data: req.user });
}

export const logout = async (req, res) => {
    await authService.logout();
    return sendSuccess(res, { message: AUTH_MESSAGES.LOGOUT_SUCCESS });
}