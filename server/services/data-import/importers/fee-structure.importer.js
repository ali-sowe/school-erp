import Joi from 'joi';
import { registerDataImporter } from '../importer-registry.js';
import { AppError } from '../../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../../constants/httpStatus.js';
import { findOwnedAcademicYearOrThrow, ensureFeeStructureDoesNotExist } from '../../../helpers/finance/fee-structure.helper.js';
import * as gradeLevelRepository from '../../../repositories/grade-level/grade-level.repository.js';
import * as feeStructureService from '../../finance/fee-structure.service.js';

const contextSchema = Joi.object({
    academic_year_id: Joi.number().integer().positive().required(),
});

const rowSchema = Joi.object({
    name: Joi.string().trim().max(150).required(),
    amount: Joi.number().positive().required(),
    // Blank means the fee applies school-wide, not to one grade level —
    // same optionality createFeeStructureSchema gives grade_level_id.
    grade_level_name: Joi.string().trim().max(150).allow('', null),
});

registerDataImporter('FEE_STRUCTURES', {
    label: 'Fee Structures',
    expectedColumns: ['name', 'amount', 'grade_level_name'],

    async resolveContext(context, schoolId) {
        const { error, value } = contextSchema.validate(context ?? {});
        if (error) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, `Import context is invalid: ${error.details.map((d) => d.message).join('; ')}`);
        }

        await findOwnedAcademicYearOrThrow(value.academic_year_id, schoolId);

        return { academic_year_id: value.academic_year_id };
    },

    async validateRow(rowData, schoolId, context) {
        const { error, value } = rowSchema.validate(rowData, { abortEarly: false, stripUnknown: true });
        if (error) {
            return { valid: false, errors: error.details.map((detail) => detail.message) };
        }

        let gradeLevelId = null;
        if (value.grade_level_name) {
            const gradeLevel = await gradeLevelRepository.findByName(schoolId, value.grade_level_name);
            if (!gradeLevel) {
                return { valid: false, errors: [`No grade level named "${value.grade_level_name}".`] };
            }
            gradeLevelId = gradeLevel.id;
        }

        try {
            await ensureFeeStructureDoesNotExist(context.academic_year_id, gradeLevelId, value.name);
        } catch {
            return { valid: false, errors: [`A fee structure named "${value.name}" already exists for this academic year/grade level.`] };
        }

        return {
            valid: true,
            errors: [],
            normalized: { academic_year_id: context.academic_year_id, grade_level_id: gradeLevelId, name: value.name, amount: value.amount },
        };
    },

    async importRow(normalizedRowData, schoolId, userId) {
        const feeStructure = await feeStructureService.createFeeStructure(normalizedRowData, schoolId, userId);
        return { entityId: feeStructure.id };
    },
});
