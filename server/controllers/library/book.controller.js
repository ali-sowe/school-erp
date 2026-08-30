import * as bookService from "../../services/library/book.service.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { BOOK_MESSAGES } from "../../constants/messages/library/book.message.js";

export const createBook = async (req, res) => {
    const book = await bookService.createBook(req.body, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: BOOK_MESSAGES.CREATED,
        data: book
    });
};

export const getBooks = async (req, res) => {
    const books = await bookService.getBooks(req.user.schoolId, {
        status: req.query.status,
        category: req.query.category,
        search: req.query.search
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: BOOK_MESSAGES.FETCHED_ALL,
        data: books
    });
};

export const getBookById = async (req, res) => {
    const book = await bookService.getBookById(req.params.id, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: BOOK_MESSAGES.FETCHED,
        data: book
    });
};

export const updateBook = async (req, res) => {
    const book = await bookService.updateBook(req.params.id, req.body, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: BOOK_MESSAGES.UPDATED,
        data: book
    });
};

export const archiveBook = async (req, res) => {
    const book = await bookService.archiveBook(req.params.id, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: BOOK_MESSAGES.ARCHIVED,
        data: book
    });
};

export const restoreBook = async (req, res) => {
    const book = await bookService.restoreBook(req.params.id, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: BOOK_MESSAGES.RESTORED,
        data: book
    });
};
