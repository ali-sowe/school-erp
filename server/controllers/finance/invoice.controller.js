import * as invoiceService from "../../services/finance/invoice.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { INVOICE_MESSAGES } from "../../constants/messages/finance/invoice.message.js";

export const createInvoice = asyncHandler(
    async (req, res) => {
        const invoice = await invoiceService.createInvoice(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: INVOICE_MESSAGES.CREATED,
            data: invoice
        });
    }
);

export const bulkGenerateInvoices = asyncHandler(
    async (req, res) => {
        const invoices = await invoiceService.bulkGenerateInvoices(
            req.body.fee_structure_id,
            req.body.class_id,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: INVOICE_MESSAGES.BULK_CREATED,
            data: invoices
        });
    }
);

export const getInvoices = asyncHandler(
    async (req, res) => {
        const invoices = await invoiceService.getInvoices(req.user.schoolId, {
            studentId: req.query.student_id,
            academicYearId: req.query.academic_year_id,
            status: req.query.status
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: INVOICE_MESSAGES.FETCHED_ALL,
            data: invoices
        });
    }
);

export const getInvoiceById = asyncHandler(
    async (req, res) => {
        const invoice = await invoiceService.getInvoiceById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: INVOICE_MESSAGES.FETCHED,
            data: invoice
        });
    }
);

export const voidInvoice = asyncHandler(
    async (req, res) => {
        const invoice = await invoiceService.voidInvoiceById(req.params.id, req.body.reason, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: INVOICE_MESSAGES.VOIDED,
            data: invoice
        });
    }
);

export const requestVoidInvoice = asyncHandler(
    async (req, res) => {
        const request = await invoiceService.requestInvoiceVoid(req.params.id, req.body.reason, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: INVOICE_MESSAGES.VOID_REQUESTED,
            data: request
        });
    }
);

export const getFeeCollectionSummary = asyncHandler(
    async (req, res) => {
        const summary = await invoiceService.getFeeCollectionSummary(req.user.schoolId, req.query.academic_year_id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: INVOICE_MESSAGES.SUMMARY_FETCHED,
            data: summary
        });
    }
);
