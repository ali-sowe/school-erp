import crypto from 'crypto';
import { registerDataImporter } from '../importer-registry.js';
import { importTeacherRowSchema } from '../../../validations/teacher/teacher.validation.js';
import { ensureEmployeeNumberIsAvailable } from '../../../helpers/teacher/teacher.helper.js';
import * as userRepository from '../../../repositories/user/user.repository.js';
import * as teacherService from '../../teacher/teacher.service.js';

// createTeacher (unlike createStudent) also creates a login — it requires
// a password. A spreadsheet has no business carrying one (plaintext
// passwords in a file staff email around is exactly the thing to avoid),
// so one is generated fresh per row at import time and handed back via
// importRow's `note` — never stored in normalized_data (which is
// persisted) and never written to the database anywhere. See the
// row_notes handling in import-batch.service.js#confirmImportBatch: it's
// surfaced in that one API response only. The admin running the import is
// responsible for relaying it to the teacher and prompting a password
// change on first login.
function generateTemporaryPassword() {
    return crypto.randomBytes(9).toString('base64url');
}

registerDataImporter('TEACHERS', {
    label: 'Teacher Records',
    expectedColumns: ['first_name', 'last_name', 'email', 'employee_number', 'qualification', 'specialization', 'hire_date'],

    async validateRow(rowData, schoolId) {
        const { error, value } = importTeacherRowSchema.validate(rowData, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            return { valid: false, errors: error.details.map((detail) => detail.message) };
        }

        const existingUser = await userRepository.findByEmail(value.email);
        if (existingUser) {
            return { valid: false, errors: [`Email "${value.email}" is already in use.`] };
        }

        if (value.employee_number) {
            try {
                await ensureEmployeeNumberIsAvailable(schoolId, value.employee_number);
            } catch {
                return { valid: false, errors: [`Employee number "${value.employee_number}" is already in use.`] };
            }
        }

        return { valid: true, errors: [], normalized: value };
    },

    async importRow(normalizedRowData, schoolId, userId) {
        const temporaryPassword = generateTemporaryPassword();

        const teacher = await teacherService.createTeacher(
            { ...normalizedRowData, password: temporaryPassword },
            schoolId,
            userId
        );

        return {
            entityId: teacher.id,
            note: `Temporary password for ${normalizedRowData.email}: ${temporaryPassword} (share securely and have them change it on first login)`,
        };
    },
});
