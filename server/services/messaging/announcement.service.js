import { validateAudience, findOwnedAnnouncementOrThrow } from "../../helpers/messaging/announcement.helper.js";
import * as announcementRepository from "../../repositories/messaging/announcement.repository.js";
import * as announcementReadRepository from "../../repositories/messaging/announcement-read.repository.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { ANNOUNCEMENT_MESSAGES } from "../../constants/messages/messaging/announcement.message.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import * as auditRepository from "../../repositories/audit/audit.repository.js";
import { getChangedFields } from "../../helpers/audit/audit.helper.js";
import { emitToSchool } from "../../helpers/realtime/realtime.helper.js";
import { notifyUsers } from "../../services/notification/notification.service.js";
import * as userRepository from "../../repositories/user/user.repository.js";

export async function createAnnouncement(data, schoolId, userId) {
    await validateAudience(data.audience_type, data.audience_id, schoolId);

    const id = await announcementRepository.create(
        { ...data, school_id: schoolId, author_id: userId },
        userId
    );

    const announcement = await announcementRepository.findById(id);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Announcement",
        entityId: id,
        action: "CREATED",
        newValues: { title: announcement.title, audience_type: announcement.audience_type, audience_id: announcement.audience_id },
        reason: "Announcement published",
        performedBy: userId
    });

    // Staff dashboards can listen on the school room for a live "new
    // announcement" feed. Once guardians/students have accounts, the same
    // event can also be emitted to their class/grade-level rooms — the
    // audience is already computed and stored, so that's additive, not a
    // redesign.
    emitToSchool(schoolId, 'announcement:new', announcement);

    // Students/guardians can't log in yet (see schema.js), so the
    // computed audience isn't who gets notified today — every other active
    // staff member is, the same staff-only scope messaging already uses.
    // getRecipients() still returns the real student/guardian audience for
    // office staff to act on manually in the meantime.
    const staff = await userRepository.findAll(schoolId);
    const staffIdsToNotify = staff
        .filter((user) => user.status === 'active' && user.id !== userId)
        .map((user) => user.id);

    await notifyUsers(staffIdsToNotify, {
        schoolId,
        type: 'ANNOUNCEMENT',
        title: announcement.title,
        body: announcement.body.slice(0, 500),
        relatedEntityType: 'Announcement',
        relatedEntityId: id,
        triggeredBy: userId
    });

    return announcement;
}

export async function getAnnouncements(schoolId, status) {
    return await announcementRepository.findAll(schoolId, status);
}

export async function getAnnouncementById(id, schoolId) {
    return await findOwnedAnnouncementOrThrow(id, schoolId);
}

export async function updateAnnouncement(id, data, schoolId, userId) {
    const announcement = await findOwnedAnnouncementOrThrow(id, schoolId);

    if (announcement.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ANNOUNCEMENT_MESSAGES.CANNOT_EDIT_ARCHIVED);
    }

    await announcementRepository.update(id, data);

    const updatedAnnouncement = await announcementRepository.findById(id);
    const changes = getChangedFields(announcement, updatedAnnouncement);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: "Announcement",
            entityId: id,
            action: "UPDATED",
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: "Announcement edited",
            performedBy: userId
        });
    }

    return updatedAnnouncement;
}

export async function archiveAnnouncement(id, schoolId, userId) {
    const announcement = await findOwnedAnnouncementOrThrow(id, schoolId);

    if (announcement.status === "ARCHIVED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ANNOUNCEMENT_MESSAGES.ALREADY_ARCHIVED);
    }

    await announcementRepository.setStatus(id, "ARCHIVED");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Announcement",
        entityId: id,
        action: "ARCHIVED",
        oldValues: { status: announcement.status },
        newValues: { status: "ARCHIVED" },
        reason: "Announcement archived",
        performedBy: userId
    });

    return await announcementRepository.findById(id);
}

export async function restoreAnnouncement(id, schoolId, userId) {
    const announcement = await findOwnedAnnouncementOrThrow(id, schoolId);

    if (announcement.status === "PUBLISHED") {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, ANNOUNCEMENT_MESSAGES.ALREADY_PUBLISHED);
    }

    await announcementRepository.setStatus(id, "PUBLISHED");

    await auditRepository.createAuditLog({
        schoolId,
        entityType: "Announcement",
        entityId: id,
        action: "RESTORED",
        oldValues: { status: announcement.status },
        newValues: { status: "PUBLISHED" },
        reason: "Announcement restored",
        performedBy: userId
    });

    return await announcementRepository.findById(id);
}

export async function markAsRead(id, schoolId, userId) {
    await findOwnedAnnouncementOrThrow(id, schoolId);
    await announcementReadRepository.markAsRead(id, userId);
}

export async function getReaders(id, schoolId) {
    await findOwnedAnnouncementOrThrow(id, schoolId);
    return await announcementReadRepository.findReaders(id);
}

// Computes who this announcement is actually for, right now — the students
// in scope plus their guardians' contact details. Since guardians can't log
// in yet (see schema.js note), this is what lets office staff act on an
// announcement manually (call/SMS a phone number) instead of it just
// sitting unseen.
export async function getRecipients(id, schoolId) {
    const announcement = await findOwnedAnnouncementOrThrow(id, schoolId);

    let students;
    if (announcement.audience_type === 'SCHOOL') {
        students = await announcementReadRepository.findStudentsForSchool(schoolId);
    } else if (announcement.audience_type === 'GRADE_LEVEL') {
        students = await announcementReadRepository.findStudentsForGradeLevel(schoolId, announcement.audience_id);
    } else {
        students = await announcementReadRepository.findStudentsForClass(schoolId, announcement.audience_id);
    }

    const guardians = await announcementReadRepository.findGuardiansForStudents(students.map((student) => student.id));

    return { students, guardians };
}
