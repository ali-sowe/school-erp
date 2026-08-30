import { findOwnedBookOrThrow } from "../../helpers/library/book.helper.js";
import { findOwnedCopyOrThrow, ensureCopyNumberIsAvailable } from "../../helpers/library/copy.helper.js";
import * as copyRepository from "../../repositories/library/copy.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { COPY_MESSAGES } from "../../constants/messages/library/copy.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";

// Either a plain quantity (school doesn't tag its copies individually) or an
// explicit list of copy_numbers (school does) — never both meaningfully at
// once, so copy_numbers takes priority when given.
export async function addCopies(bookId, data, schoolId, userId = null) {
    const book = await findOwnedBookOrThrow(bookId, schoolId);

    if (book.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, COPY_MESSAGES.BOOK_ARCHIVED);
    }

    const copyNumbers = data.copy_numbers && data.copy_numbers.length > 0
        ? data.copy_numbers
        : Array.from({ length: data.quantity ?? 0 }, () => null);

    if (copyNumbers.length === 0) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, COPY_MESSAGES.QUANTITY_OR_COPY_NUMBERS_REQUIRED);
    }

    for (const copyNumber of copyNumbers) {
        await ensureCopyNumberIsAvailable(schoolId, copyNumber);
    }

    const copies = [];
    for (const copyNumber of copyNumbers) {
        const id = await copyRepository.create({ school_id: schoolId, book_id: bookId, copy_number: copyNumber }, userId);
        copies.push(await copyRepository.findById(id));
    }

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Book",
        entityId: bookId,
        action: "COPIES_ADDED",
        oldValues: {},
        newValues: { count: copies.length },
        reason: "Copies added to catalog",
        performedBy: userId
    });

    return copies;
}

export async function getCopiesForBook(bookId, status, schoolId) {
    await findOwnedBookOrThrow(bookId, schoolId);

    return await copyRepository.findForBook(bookId, status);
}

export async function withdrawCopy(copyId, reason, schoolId, userId = null) {
    const copy = await findOwnedCopyOrThrow(copyId, schoolId);

    if (copy.status === "WITHDRAWN") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, COPY_MESSAGES.ALREADY_WITHDRAWN);
    }

    if (copy.status === "BORROWED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, COPY_MESSAGES.CANNOT_WITHDRAW_BORROWED);
    }

    await copyRepository.setStatus(copyId, "WITHDRAWN", reason);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "BookCopy",
        entityId: copyId,
        action: "WITHDRAWN",
        oldValues: { status: copy.status },
        newValues: { status: "WITHDRAWN" },
        reason,
        performedBy: userId
    });

    return await copyRepository.findById(copyId);
}

export async function restoreCopy(copyId, schoolId, userId = null) {
    const copy = await findOwnedCopyOrThrow(copyId, schoolId);

    if (copy.status !== "WITHDRAWN") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, COPY_MESSAGES.NOT_WITHDRAWN);
    }

    await copyRepository.setStatus(copyId, "AVAILABLE", null);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "BookCopy",
        entityId: copyId,
        action: "RESTORED",
        oldValues: { status: copy.status },
        newValues: { status: "AVAILABLE" },
        reason: "Copy restored to available",
        performedBy: userId
    });

    return await copyRepository.findById(copyId);
}
