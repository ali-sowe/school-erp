import * as documentService from '../../services/document/document.service.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { DOCUMENT_MESSAGES } from '../../constants/messages/document/document.message.js';

export const uploadDocument = async (req, res) => {
    const document = await documentService.uploadDocument(req.file, req.body, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: DOCUMENT_MESSAGES.UPLOADED,
        data: document
    });
};

export const getDocuments = async (req, res) => {
    const documents = await documentService.getDocuments(req.user.schoolId, {
        kind: req.query.kind,
        category: req.query.category,
        status: req.query.status,
        relatedEntityType: req.query.related_entity_type,
        relatedEntityId: req.query.related_entity_id,
        search: req.query.search
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DOCUMENT_MESSAGES.FETCHED_ALL,
        data: documents
    });
};

export const getDocumentById = async (req, res) => {
    const document = await documentService.getDocumentById(req.params.id, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DOCUMENT_MESSAGES.FETCHED,
        data: document
    });
};

export const downloadDocument = async (req, res) => {
    const { absolutePath, originalFilename } = await documentService.getDownloadDetails(req.params.id, req.user.schoolId);

    res.download(absolutePath, originalFilename);
};

export const previewDocument = async (req, res) => {
    const { absolutePath, originalFilename } = await documentService.getPreviewDetails(req.params.id, req.user.schoolId);

    res.download(absolutePath, originalFilename);
};

export const reprocessDocument = async (req, res) => {
    const document = await documentService.reprocessDocument(req.params.id, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DOCUMENT_MESSAGES.PROCESSING_TRIGGERED,
        data: document
    });
};

export const searchDocuments = async (req, res) => {
    const documents = await documentService.searchDocuments(req.user.schoolId, req.query.q, {
        status: req.query.status
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DOCUMENT_MESSAGES.SEARCHED,
        data: documents
    });
};

export const updateDocument = async (req, res) => {
    const document = await documentService.updateDocument(req.params.id, req.body, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DOCUMENT_MESSAGES.UPDATED,
        data: document
    });
};

export const archiveDocument = async (req, res) => {
    const document = await documentService.archiveDocument(req.params.id, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DOCUMENT_MESSAGES.ARCHIVED,
        data: document
    });
};

export const restoreDocument = async (req, res) => {
    const document = await documentService.restoreDocument(req.params.id, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DOCUMENT_MESSAGES.RESTORED,
        data: document
    });
};
