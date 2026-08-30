import { MESSAGES } from '../constants/messages.js';
import { sendSuccess } from '../helpers/response.helper.js';

export const getHealth = async (req, res) => {
    return sendSuccess(res, {
        message: MESSAGES.HEALTH_OK,
        data: {
            version: '1.0.0'
        }
    });
}