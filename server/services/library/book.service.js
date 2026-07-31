import { findOwnedBookOrThrow, ensureIsbnIsAvailable } from "../../helpers/library/book.helper.js";
import * as bookRepository from "../../repositories/library/book.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { BOOK_MESSAGES } from "../../constants/messages/library/book.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

export async function createBook(data, schoolId, userId = null) {
    await ensureIsbnIsAvailable(schoolId, data.isbn);

    const id = await bookRepository.create({ ...data, school_id: schoolId }, userId);

    return await bookRepository.findById(id);
}

export async function getBooks(schoolId, filters) {
    return await bookRepository.findAll(schoolId, filters);
}

export async function getBookById(id, schoolId) {
    const book = await findOwnedBookOrThrow(id, schoolId);
    const copyCounts = await bookRepository.getCopyCounts(id);

    return { ...book, copies: copyCounts };
}

export async function updateBook(id, data, schoolId, userId = null) {
    const book = await findOwnedBookOrThrow(id, schoolId);

    if (book.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, BOOK_MESSAGES.CANNOT_EDIT_ARCHIVED);
    }

    if (data.isbn && data.isbn !== book.isbn) {
        await ensureIsbnIsAvailable(schoolId, data.isbn, book.id);
    }

    await bookRepository.update(id, data);

    const updatedBook = await bookRepository.findById(id);
    const changes = getChangedFields(book, updatedBook);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "Book",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Book information updated",
            performedBy: userId
        });
    }

    return updatedBook;
}

export async function archiveBook(id, schoolId, userId = null) {
    const book = await findOwnedBookOrThrow(id, schoolId);

    if (book.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, BOOK_MESSAGES.ALREADY_ARCHIVED);
    }

    await bookRepository.setStatus(id, "ARCHIVED");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Book",
        entityId: id,
        action: "ARCHIVED",
        oldValues: { status: book.status },
        newValues: { status: "ARCHIVED" },
        reason: "Book archived",
        performedBy: userId
    });

    return await bookRepository.findById(id);
}

export async function restoreBook(id, schoolId, userId = null) {
    const book = await findOwnedBookOrThrow(id, schoolId);

    if (book.status === "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, BOOK_MESSAGES.ALREADY_ACTIVE);
    }

    await bookRepository.setStatus(id, "ACTIVE");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Book",
        entityId: id,
        action: "RESTORED",
        oldValues: { status: book.status },
        newValues: { status: "ACTIVE" },
        reason: "Book restored",
        performedBy: userId
    });

    return await bookRepository.findById(id);
}
