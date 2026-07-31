import { findOwnedCalendarEventOrThrow, findOwnedAcademicYearOrThrow, validateDateRange } from "../../helpers/calendar/calendar.helper.js";
import * as calendarRepository from "../../repositories/calendar/calendar.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { CALENDAR_MESSAGES } from "../../constants/messages/calendar/calendar.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";

export async function createEvent(data, schoolId, userId = null) {
    await findOwnedAcademicYearOrThrow(data.academic_year_id, schoolId);
    validateDateRange(data.start_date, data.end_date);

    const id = await calendarRepository.create({ ...data, school_id: schoolId }, userId);

    return await calendarRepository.findById(id);
}

export async function getEvents(schoolId, filters) {
    return await calendarRepository.findAll(schoolId, filters);
}

export async function getEventById(id, schoolId) {
    return await findOwnedCalendarEventOrThrow(id, schoolId);
}

export async function updateEvent(id, data, schoolId, userId = null) {
    const event = await findOwnedCalendarEventOrThrow(id, schoolId);

    if (event.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CALENDAR_MESSAGES.CANNOT_EDIT_ARCHIVED);
    }

    const nextStartDate = data.start_date ?? event.start_date;
    const nextEndDate = data.end_date ?? event.end_date;
    validateDateRange(nextStartDate, nextEndDate);

    await calendarRepository.update(id, data);

    const updatedEvent = await calendarRepository.findById(id);
    const changes = getChangedFields(event, updatedEvent);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "CalendarEvent",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Calendar event updated",
            performedBy: userId
        });
    }

    return updatedEvent;
}

export async function archiveEvent(id, schoolId, userId = null) {
    const event = await findOwnedCalendarEventOrThrow(id, schoolId);

    if (event.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CALENDAR_MESSAGES.ALREADY_ARCHIVED);
    }

    await calendarRepository.setStatus(id, "ARCHIVED");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "CalendarEvent",
        entityId: id,
        action: "ARCHIVED",
        oldValues: { status: event.status },
        newValues: { status: "ARCHIVED" },
        reason: "Calendar event archived",
        performedBy: userId
    });

    return await calendarRepository.findById(id);
}

export async function restoreEvent(id, schoolId, userId = null) {
    const event = await findOwnedCalendarEventOrThrow(id, schoolId);

    if (event.status === "ACTIVE") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, CALENDAR_MESSAGES.ALREADY_ACTIVE);
    }

    await calendarRepository.setStatus(id, "ACTIVE");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "CalendarEvent",
        entityId: id,
        action: "RESTORED",
        oldValues: { status: event.status },
        newValues: { status: "ACTIVE" },
        reason: "Calendar event restored",
        performedBy: userId
    });

    return await calendarRepository.findById(id);
}

// Convenience for the common "most of last year's calendar still applies"
// case — copies every active event's title/category/dates verbatim into a
// new academic year, unmodified. Deliberately not automatic (see
// migrations/025_create_calendar_events.sql): a school triggers this once,
// then edits whichever copied entries have Islamic-calendar-linked or
// otherwise movable dates before relying on them — the copy is a starting
// point, not a promise the dates are still correct.
export async function copyEventsToYear(sourceAcademicYearId, targetAcademicYearId, schoolId, userId = null) {
    await findOwnedAcademicYearOrThrow(sourceAcademicYearId, schoolId);
    await findOwnedAcademicYearOrThrow(targetAcademicYearId, schoolId);

    const sourceEvents = await calendarRepository.findAll(schoolId, {
        academicYearId: sourceAcademicYearId,
        status: "ACTIVE"
    });

    const copiedEvents = [];

    for (const sourceEvent of sourceEvents) {
        const id = await calendarRepository.create(
            {
                school_id: schoolId,
                academic_year_id: targetAcademicYearId,
                title: sourceEvent.title,
                description: sourceEvent.description,
                category: sourceEvent.category,
                start_date: sourceEvent.start_date,
                end_date: sourceEvent.end_date,
                is_school_closed: sourceEvent.is_school_closed
            },
            userId
        );
        copiedEvents.push(await calendarRepository.findById(id));
    }

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "CalendarEvent",
        entityId: targetAcademicYearId,
        action: "COPIED_FROM_YEAR",
        newValues: { source_academic_year_id: sourceAcademicYearId, count: copiedEvents.length },
        reason: "Calendar events copied from a previous academic year",
        performedBy: userId
    });

    return copiedEvents;
}

// The integration point other modules call — attendance.service.js today,
// potentially exam scheduling or fee-period alignment later (see the
// Calendar Engine's stated future dependencies). Throws rather than
// returning a boolean so every caller gets the same clear, specific error
// message for free instead of writing their own.
export async function ensureSchoolIsOpenOnDate(schoolId, date) {
    const closure = await calendarRepository.findClosureForDate(schoolId, date);

    if (closure) {
        throw new AppError(
            HTTP_STATUS.BAD_REQUEST,
            CALENDAR_MESSAGES.SCHOOL_CLOSED_ON_DATE,
            [`${closure.title} (${closure.start_date} to ${closure.end_date})`]
        );
    }
}
