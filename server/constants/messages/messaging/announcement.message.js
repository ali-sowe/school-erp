export const ANNOUNCEMENT_MESSAGES = {
    CREATED: 'Announcement published successfully.',
    UPDATED: 'Announcement updated successfully.',
    FETCHED: 'Announcement retrieved successfully.',
    FETCHED_ALL: 'Announcements retrieved successfully.',
    ARCHIVED: 'Announcement archived successfully.',
    RESTORED: 'Announcement restored successfully.',

    NOT_FOUND: 'Announcement not found.',

    INVALID_AUDIENCE_TYPE: 'audience_type must be SCHOOL, GRADE_LEVEL, or CLASS.',
    AUDIENCE_ID_REQUIRED: 'audience_id is required for this audience type.',
    AUDIENCE_ID_NOT_ALLOWED: 'audience_id must not be set for a SCHOOL-wide announcement.',
    GRADE_LEVEL_NOT_FOUND: 'The specified grade level does not exist.',
    CLASS_NOT_FOUND: 'The specified class does not exist.',

    ALREADY_ARCHIVED: 'This announcement has already been archived.',
    ALREADY_PUBLISHED: 'This announcement is already published.',
    CANNOT_EDIT_ARCHIVED: 'An archived announcement cannot be modified. Restore it first.',

    RECIPIENTS_FETCHED: 'Announcement recipients retrieved successfully.',
    MARKED_AS_READ: 'Announcement marked as read.'
};
