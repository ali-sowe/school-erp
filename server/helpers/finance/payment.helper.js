import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { PAYMENT_MESSAGES } from "../../constants/messages/finance/payment.message.js";
import { AppError } from "../app-error.helper.js";
import * as paymentRepository from "../../repositories/finance/payment.repository.js";

export function validateAmount(amount, message) {
    if (!(amount > 0)) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, message);
    }
}

// Same tenant-ownership check used throughout the codebase.
export async function findOwnedPaymentOrThrow(paymentId, schoolId) {
    const payment = await paymentRepository.findById(paymentId);

    if (!payment || payment.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, PAYMENT_MESSAGES.NOT_FOUND);
    }

    return payment;
}
