import * as paymentService from "../../services/finance/payment.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { PAYMENT_MESSAGES } from "../../constants/messages/finance/payment.message.js";

export const recordPayment = asyncHandler(
    async (req, res) => {
        const payment = await paymentService.recordPayment(req.params.id, req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: PAYMENT_MESSAGES.RECORDED,
            data: payment
        });
    }
);

export const getPaymentsForInvoice = asyncHandler(
    async (req, res) => {
        const payments = await paymentService.getPaymentsForInvoice(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: PAYMENT_MESSAGES.FETCHED_ALL,
            data: payments
        });
    }
);

export const voidPayment = asyncHandler(
    async (req, res) => {
        const payment = await paymentService.voidPaymentById(req.params.paymentId, req.body.reason, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: PAYMENT_MESSAGES.VOIDED,
            data: payment
        });
    }
);

export const requestVoidPayment = asyncHandler(
    async (req, res) => {
        const request = await paymentService.requestPaymentVoid(req.params.paymentId, req.body.reason, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: PAYMENT_MESSAGES.VOID_REQUESTED,
            data: request
        });
    }
);
