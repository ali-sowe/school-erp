import * as importBatchService from '../../services/data-import/import-batch.service.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { DATA_IMPORT_MESSAGES } from '../../constants/messages/data-import/data-import.message.js';

export const getTargetTypes = async (req, res) => {
    const targetTypes = importBatchService.getAvailableImportTypes();

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DATA_IMPORT_MESSAGES.TARGET_TYPES_FETCHED,
        data: targetTypes
    });
};

export const createImportBatch = async (req, res) => {
    const batch = await importBatchService.createImportBatch(
        req.body.document_id,
        req.body.target_type,
        req.body.context,
        req.user.schoolId,
        req.user.userId
    );

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: DATA_IMPORT_MESSAGES.CREATED,
        data: batch
    });
};

export const getImportBatches = async (req, res) => {
    const batches = await importBatchService.getImportBatches(req.user.schoolId, {
        targetType: req.query.target_type,
        status: req.query.status
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DATA_IMPORT_MESSAGES.FETCHED_ALL,
        data: batches
    });
};

export const getImportBatchById = async (req, res) => {
    const batch = await importBatchService.getImportBatchById(req.params.id, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DATA_IMPORT_MESSAGES.FETCHED,
        data: batch
    });
};

export const getImportBatchRows = async (req, res) => {
    const rows = await importBatchService.getImportBatchRows(req.params.id, req.user.schoolId, {
        status: req.query.status
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DATA_IMPORT_MESSAGES.ROWS_FETCHED,
        data: rows
    });
};

export const confirmImportBatch = async (req, res) => {
    const batch = await importBatchService.confirmImportBatch(req.params.id, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DATA_IMPORT_MESSAGES.CONFIRMED,
        data: batch
    });
};

export const cancelImportBatch = async (req, res) => {
    const batch = await importBatchService.cancelImportBatch(req.params.id, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DATA_IMPORT_MESSAGES.CANCELLED,
        data: batch
    });
};
