import { registerDataImporter } from '../importer-registry.js';
import { createStudentSchema } from '../../../validations/student/student.validation.js';
import { ensureAdmissionNumberIsAvailable } from '../../../helpers/student/student.helper.js';
import * as studentService from '../../student/student.service.js';

// Reference implementation for the Data Import Engine (see ADR: Microsoft
// Office Document Processing — "student lists" is listed first among data
// documents). Deliberately reuses createStudentSchema and
// studentService.createStudent rather than re-implementing student
// creation rules here, so an imported row is held to exactly the same
// validation and gets exactly the same side effects (admission-number
// fallback, audit logging) as a row created through the regular endpoint.
//
// Teacher records / exam marks / fee structures / attendance / timetables
// (also listed in the ADR) follow the same shape: a new file under
// importers/, registered here, reusing that domain's own service — no
// change to the engine itself.
registerDataImporter('STUDENTS', {
    label: 'Student List',
    expectedColumns: ['admission_number', 'first_name', 'last_name', 'gender', 'date_of_birth', 'admission_date'],

    async validateRow(rowData, schoolId) {
        const { error, value } = createStudentSchema.validate(rowData, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            return {
                valid: false,
                errors: error.details.map((detail) => detail.message),
            };
        }

        if (value.admission_number) {
            try {
                await ensureAdmissionNumberIsAvailable(schoolId, value.admission_number);
            } catch {
                return {
                    valid: false,
                    errors: [`Admission number "${value.admission_number}" is already in use.`],
                };
            }
        }

        return { valid: true, errors: [], normalized: value };
    },

    async importRow(normalizedRowData, schoolId, userId) {
        const student = await studentService.createStudent(normalizedRowData, schoolId, userId);
        return { entityId: student.id };
    },
});
