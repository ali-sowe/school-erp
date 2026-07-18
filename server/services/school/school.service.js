import * as schoolRepository from "../../repositories/school/school.repository.js";
import * as roleRepository from "../../repositories/role/role.repository.js";
import * as userRepository from "../../repositories/user/user.repository.js";
import { transaction } from "../../database/transaction.js";
import { slugify } from "../../helpers/school/slug.helper.js";
import { hashPassword } from "../../helpers/password.helper.js";
import { generateCode } from "../../helpers/code-generator.helper.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { SCHOOL_MESSAGES } from "../../constants/messages/school/school.message.js";
import { USER_MESSAGES } from "../../constants/messages/user.message.js";

// Every school starts with these. Schools can rename/add roles later
// (ADR-005: Configuration Over Hardcoding) — this is just the day-one set.
const DEFAULT_SCHOOL_ROLES = [
    { role_name: 'Administrator', description: 'Full administrative access within this school.' },
    { role_name: 'Teacher', description: 'Teaching staff.' },
    { role_name: 'Student', description: 'Enrolled student.' },
    { role_name: 'Parent', description: 'Parent or guardian of an enrolled student.' }
];

async function ensureUniqueNameAndSlug(name, slug) {
    const existingByName = await schoolRepository.findByName(name);
    if (existingByName) {
        throw new AppError(HTTP_STATUS.CONFLICT, SCHOOL_MESSAGES.DUPLICATE_NAME);
    }

    const existingBySlug = await schoolRepository.findBySlug(slug);
    if (existingBySlug) {
        throw new AppError(HTTP_STATUS.CONFLICT, SCHOOL_MESSAGES.DUPLICATE_SLUG);
    }
}

// Onboards a school and its first Administrator atomically: if any step
// fails, nothing is left half-created — no orphaned school with no admin,
// no role sitting under a school that doesn't exist.
export async function createSchool(data) {
    const slug = slugify(data.name);

    await ensureUniqueNameAndSlug(data.name, slug);

    const existingUser = await userRepository.findByEmail(data.admin.email);
    if (existingUser) {
        throw new AppError(HTTP_STATUS.CONFLICT, USER_MESSAGES.DUPLICATE_EMAIL);
    }

    const hashedPassword = await hashPassword(data.admin.password);

    const schoolId = await transaction(async (connection) => {
        const newSchoolId = await schoolRepository.create(
            {
                name: data.name,
                slug,
                ownership_type: data.ownership_type,
                region: data.region,
                education_levels: data.education_levels
            },
            connection
        );

        let administratorRoleId = null;

        for (const roleDefinition of DEFAULT_SCHOOL_ROLES) {
            const roleId = await roleRepository.create(
                { school_id: newSchoolId, ...roleDefinition },
                connection
            );

            if (roleDefinition.role_name === 'Administrator') {
                administratorRoleId = roleId;
            }
        }

        await userRepository.create(
            {
                school_id: newSchoolId,
                user_code: generateCode('USR', Date.now()),
                first_name: data.admin.first_name,
                last_name: data.admin.last_name,
                email: data.admin.email,
                password: hashedPassword,
                role_id: administratorRoleId,
                status: 'active'
            },
            connection
        );

        return newSchoolId;
    });

    return await schoolRepository.findById(schoolId);
}

export async function getSchools() {
    return await schoolRepository.findAll();
}

// A school's own Administrator may view their own school; only the Platform
// Administrator (schoolId === null) may view any school.
export async function getSchoolById(id, requestingSchoolId) {
    const school = await schoolRepository.findById(id);

    if (!school) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, SCHOOL_MESSAGES.NOT_FOUND);
    }

    if (requestingSchoolId !== null && requestingSchoolId !== school.id) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, SCHOOL_MESSAGES.NOT_FOUND);
    }

    return school;
}

export async function updateSchool(id, data) {
    const school = await schoolRepository.findById(id);

    if (!school) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, SCHOOL_MESSAGES.NOT_FOUND);
    }

    if (data.name && data.name !== school.name) {
        const existingByName = await schoolRepository.findByName(data.name);
        if (existingByName && existingByName.id !== school.id) {
            throw new AppError(HTTP_STATUS.CONFLICT, SCHOOL_MESSAGES.DUPLICATE_NAME);
        }
    }

    await schoolRepository.update(id, data);

    return await schoolRepository.findById(id);
}

export async function suspendSchool(id) {
    const school = await schoolRepository.findById(id);

    if (!school) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, SCHOOL_MESSAGES.NOT_FOUND);
    }

    if (school.status === 'SUSPENDED') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, SCHOOL_MESSAGES.ALREADY_SUSPENDED);
    }

    await schoolRepository.setStatus(id, 'SUSPENDED');

    return await schoolRepository.findById(id);
}

export async function reactivateSchool(id) {
    const school = await schoolRepository.findById(id);

    if (!school) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, SCHOOL_MESSAGES.NOT_FOUND);
    }

    if (school.status === 'ACTIVE') {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, SCHOOL_MESSAGES.ALREADY_ACTIVE);
    }

    await schoolRepository.setStatus(id, 'ACTIVE');

    return await schoolRepository.findById(id);
}
