import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { BOOK_MESSAGES } from "../../constants/messages/library/book.message.js";
import { AppError } from "../app-error.helper.js";
import * as bookRepository from "../../repositories/library/book.repository.js";

// Same tenant-ownership pattern used throughout (student.helper.js,
// subject.service.js's findOwnedSubjectOrThrow, etc).
export async function findOwnedBookOrThrow(bookId, schoolId) {
    const book = await bookRepository.findById(bookId);

    if (!book || book.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, BOOK_MESSAGES.NOT_FOUND);
    }

    return book;
}

export async function ensureIsbnIsAvailable(schoolId, isbn, excludeBookId = null) {
    if (!isbn) {
        return;
    }

    const existing = await bookRepository.findByIsbn(schoolId, isbn);
    if (existing && existing.id !== excludeBookId) {
        throw new AppError(HTTP_STATUS.CONFLICT, BOOK_MESSAGES.DUPLICATE_ISBN);
    }
}
