import * as borrowService from "../../services/library/borrow.service.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { BORROW_MESSAGES } from "../../constants/messages/library/borrow.message.js";

// POST /api/library/books/:id/borrow
export const borrowBook = async (req, res) => {
    const record = await borrowService.borrowBook(req.params.id, req.body, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: BORROW_MESSAGES.BORROWED,
        data: record
    });
};

// PATCH /api/library/borrow-records/:id/return
export const returnBook = async (req, res) => {
    const record = await borrowService.returnBook(req.params.id, req.body, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: BORROW_MESSAGES.RETURNED,
        data: record
    });
};

// GET /api/library/borrow-records?student_id=&book_id=&status=&overdue=true
export const getBorrowRecords = async (req, res) => {
    const records = await borrowService.getBorrowRecords(req.user.schoolId, {
        studentId: req.query.student_id,
        bookId: req.query.book_id,
        status: req.query.status,
        overdueOnly: req.query.overdue === 'true'
    });

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: BORROW_MESSAGES.FETCHED_ALL,
        data: records
    });
};

// GET /api/library/borrow-records/:id
export const getBorrowRecordById = async (req, res) => {
    const record = await borrowService.getBorrowRecordById(req.params.id, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: BORROW_MESSAGES.FETCHED,
        data: record
    });
};

// GET /api/students/:id/library/borrow-records?from=&to=
export const getStudentBorrowHistory = async (req, res) => {
    const history = await borrowService.getStudentBorrowHistory(
        req.params.id,
        { from: req.query.from, to: req.query.to },
        req.user.schoolId
    );

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: BORROW_MESSAGES.FETCHED_ALL,
        data: history
    });
};
