import { findOwnedBookOrThrow } from "../../helpers/library/book.helper.js";
import { findOwnedCopyOrThrow } from "../../helpers/library/copy.helper.js";
import { findOwnedStudentOrThrow } from "../../helpers/student/student.helper.js";
import {
    findOwnedBorrowRecordOrThrow,
    validateBorrowDates,
    validateDateRange
} from "../../helpers/library/borrow.helper.js";
import * as borrowRepository from "../../repositories/library/borrow.repository.js";
import * as copyRepository from "../../repositories/library/copy.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { BORROW_MESSAGES } from "../../constants/messages/library/borrow.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { transaction } from "../../database/transaction.js";

const RETURN_CONDITIONS = ['GOOD', 'DAMAGED', 'LOST'];

// A copy that comes back DAMAGED/LOST still ends the borrow (it's no longer
// out with the student) but the copy itself doesn't return to AVAILABLE —
// it carries the same status forward so it isn't accidentally re-issued.
const BORROW_STATUS_FOR_CONDITION = {
    GOOD: 'RETURNED',
    DAMAGED: 'DAMAGED',
    LOST: 'LOST'
};
const COPY_STATUS_FOR_CONDITION = {
    GOOD: 'AVAILABLE',
    DAMAGED: 'DAMAGED',
    LOST: 'LOST'
};

// Issues one copy of a book to a student. If copy_id isn't given, whichever
// AVAILABLE copy of that book is picked automatically — the common
// librarian workflow of "give them a copy of X", not "give them copy #7".
export async function borrowBook(bookId, data, schoolId, userId = null) {
    const book = await findOwnedBookOrThrow(bookId, schoolId);

    if (book.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, BORROW_MESSAGES.BOOK_ARCHIVED);
    }

    const student = await findOwnedStudentOrThrow(data.student_id, schoolId);

    if (student.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, BORROW_MESSAGES.STUDENT_ARCHIVED);
    }

    validateBorrowDates(data.borrowed_date, data.due_date);

    const existingActiveBorrow = await borrowRepository.findActiveForStudentAndBook(data.student_id, bookId);
    if (existingActiveBorrow) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, BORROW_MESSAGES.ALREADY_BORROWING_THIS_BOOK);
    }

    // If a specific copy is requested up front, ownership is checked outside
    // the transaction (a plain read is enough to give a clear 404); its
    // AVAILABLE status is re-checked with a row lock inside the transaction
    // below, since that's the fact that can actually race.
    if (data.copy_id) {
        const requestedCopy = await findOwnedCopyOrThrow(data.copy_id, schoolId);
        if (requestedCopy.book_id !== Number(bookId)) {
            throw new AppError(HTTP_STATUS.NOT_FOUND, BORROW_MESSAGES.COPY_NOT_FOUND);
        }
    }

    const borrowRecordId = await transaction(async (connection) => {
        const copy = data.copy_id
            ? await copyRepository.findByIdForUpdate(data.copy_id, connection)
            : await copyRepository.findFirstAvailableForBook(bookId, connection);

        if (!copy) {
            throw new AppError(
                HTTP_STATUS.BAD_REQUEST,
                data.copy_id ? BORROW_MESSAGES.COPY_NOT_AVAILABLE : BORROW_MESSAGES.NO_COPIES_AVAILABLE
            );
        }

        if (copy.status !== 'AVAILABLE') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, BORROW_MESSAGES.COPY_NOT_AVAILABLE);
        }

        const newBorrowRecordId = await borrowRepository.create(
            {
                school_id: schoolId,
                book_copy_id: copy.id,
                student_id: data.student_id,
                borrowed_date: data.borrowed_date,
                due_date: data.due_date,
                issued_by: userId
            },
            connection
        );

        await copyRepository.setStatus(copy.id, 'BORROWED', null, connection);

        return newBorrowRecordId;
    });

    const borrowRecord = await borrowRepository.findById(borrowRecordId);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "BorrowRecord",
        entityId: borrowRecordId,
        action: "BORROWED",
        oldValues: {},
        newValues: { student_id: data.student_id, book_copy_id: borrowRecord.book_copy_id, due_date: data.due_date },
        reason: "Book issued",
        performedBy: userId
    });

    return borrowRecord;
}

export async function returnBook(id, data, schoolId, userId = null) {
    const record = await findOwnedBorrowRecordOrThrow(id, schoolId);

    if (record.status !== "BORROWED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, BORROW_MESSAGES.ALREADY_RETURNED);
    }

    const condition = RETURN_CONDITIONS.includes(data.condition) ? data.condition : 'GOOD';
    const returnedDate = data.returned_date ?? new Date();

    await transaction(async (connection) => {
        const returnedRows = await borrowRepository.markReturned(
            id,
            {
                status: BORROW_STATUS_FOR_CONDITION[condition],
                returnedDate,
                returnedBy: userId,
                remarks: data.remarks
            },
            connection
        );

        // Someone else's return of this exact record won the race between
        // our read of "still BORROWED" and this UPDATE — roll back rather
        // than also changing the copy's status for a return that didn't
        // really win (same guard pattern as approval.service.js's decideStep).
        if (returnedRows === 0) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, BORROW_MESSAGES.ALREADY_RETURNED);
        }

        await copyRepository.setStatus(
            record.book_copy_id,
            COPY_STATUS_FOR_CONDITION[condition],
            condition === 'GOOD' ? null : `Reported ${condition.toLowerCase()} on return`,
            connection
        );
    });

    const updatedRecord = await borrowRepository.findById(id);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "BorrowRecord",
        entityId: id,
        action: BORROW_STATUS_FOR_CONDITION[condition] === 'RETURNED' ? "RETURNED" : "RETURNED_" + condition,
        oldValues: { status: record.status },
        newValues: { status: updatedRecord.status },
        reason: data.remarks || "Book returned",
        performedBy: userId
    });

    return updatedRecord;
}

export async function getBorrowRecords(schoolId, filters) {
    return await borrowRepository.findAll(schoolId, filters);
}

export async function getBorrowRecordById(id, schoolId) {
    return await findOwnedBorrowRecordOrThrow(id, schoolId);
}

export async function getStudentBorrowHistory(studentId, { from, to } = {}, schoolId) {
    await findOwnedStudentOrThrow(studentId, schoolId);
    validateDateRange(from, to);

    return await borrowRepository.findForStudent(studentId, { from, to });
}
