export const TERM_MESSAGES = {
    CREATED: 'Term created successfully.',
    UPDATED: 'Term updated successfully.',
    FETCHED: 'Term retrieved successfully.',
    FETCHED_ALL: 'Terms retrieved successfully.',
    ACTIVATED: 'Term activated successfully.',
    COMPLETED: 'Term completed successfully.',

    NOT_FOUND: 'Term not found.',
    DUPLICATE_NAME: 'A term with this name already exists for this academic year.',
    INVALID_DATE_RANGE: 'The end date must be later than the start date.',

    ACADEMIC_YEAR_NOT_FOUND: 'The specified academic year does not exist.',
    ACADEMIC_YEAR_COMPLETED: 'Cannot add or edit terms on a completed academic year.',
    OUTSIDE_ACADEMIC_YEAR: 'Term dates must fall within the academic year\'s dates.',

    ALREADY_ACTIVE: 'This term is already active.',
    ALREADY_COMPLETED: 'This term has already been completed.',
    ONLY_ONE_ACTIVE_PER_YEAR: 'Only one term can be active at a time within the same academic year.',
    ACADEMIC_YEAR_NOT_ACTIVE: 'A term can only be activated while its academic year is active.',
    CANNOT_ACTIVATE_COMPLETED: 'A completed term cannot be activated.',
    CANNOT_COMPLETE_INACTIVE: 'Only an active term can be completed.',

    CANNOT_ACTIVATE_FUTURE: 'This term cannot be activated before its scheduled start date.',
    CANNOT_EDIT_COMPLETED: 'A completed term cannot be modified.',

    OVERRIDE_REQUIRED: 'This action is outside the allowed scheduling window and requires an authorized override.',
    OVERRIDE_SUCCESS: 'Term schedule overridden successfully.'
};
