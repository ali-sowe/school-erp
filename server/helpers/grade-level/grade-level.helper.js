import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { GRADE_LEVEL_MESSAGES } from "../../constants/messages/grade-level/grade-level.message.js";
import { AppError } from "../app-error.helper.js";
import * as gradeLevelRepository from "../../repositories/grade-level/grade-level.repository.js";
import * as schoolRepository from "../../repositories/school/school.repository.js";

export async function ensureGradeLevelDoesNotExist(schoolId, name) {
    const existing = await gradeLevelRepository.findByName(schoolId, name);

    if (existing) {
        throw new AppError(HTTP_STATUS.CONFLICT, GRADE_LEVEL_MESSAGES.DUPLICATE_NAME);
    }
}

// A grade level's education_level must be one the school actually configured
// at onboarding (schools.education_levels) — the ERP adapts to each school's
// structure instead of assuming a fixed set of levels (Gambian Education
// System Context doc: "The system must not assume that every school has
// every level"). A school with no configured levels yet is left unrestricted
// so onboarding order doesn't block this module.
export async function ensureEducationLevelIsConfigured(schoolId, educationLevel) {
    const school = await schoolRepository.findById(schoolId);
    const configuredLevels = Array.isArray(school?.education_levels) ? school.education_levels : [];

    if (configuredLevels.length > 0 && !configuredLevels.includes(educationLevel)) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, GRADE_LEVEL_MESSAGES.EDUCATION_LEVEL_NOT_CONFIGURED);
    }
}
