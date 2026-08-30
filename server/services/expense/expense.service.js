import {
    validateAmount,
    findOwnedExpenseOrThrow,
    findOwnedActiveCategoryOrThrow,
    findOwnedAcademicYearOrThrow,
    findOwnedActiveAcademicYearOrThrow
} from "../../helpers/expense/expense.helper.js";
import * as expenseRepository from "../../repositories/expense/expense.repository.js";
import { EXPENSE_MESSAGES } from "../../constants/messages/expense/expense.message.js";
import { createApprovalRequest } from "../approval/approval.service.js";
import { registerRequiredSteps } from "../approval/workflow-step-policy-registry.js";

// No registerWorkflowExecutor for 'EXPENSE_APPROVAL' (see comment below),
// but it still always intends an Administrator-only approver — same
// reasoning and same fix as PAYMENT_VOID/INVOICE_VOID/STUDENT_TRANSFER/
// ACADEMIC_YEAR_OVERRIDE/LEAVE_REQUEST (see
// workflow-step-policy-registry.js). Expenses are money, same as
// payments/invoices, so this one is worth closing even though there's no
// executor to abuse yet.
registerRequiredSteps('EXPENSE_APPROVAL', [{ approver_role_name: 'Administrator' }]);

// Deliberately does not register a workflow executor for
// 'EXPENSE_APPROVAL' (compare invoice.service.js's INVOICE_VOID executor,
// which actually mutates the invoice on execute). Recording an expense has
// no further side effect to apply to another table once approved — the
// approval itself *is* the outcome the requester needed, same reasoning as
// leave-request.service.js's LEAVE_REQUEST. PATCH
// /api/approval-requests/:id/execute is still available afterwards and
// mostly for symmetry/record-keeping with workflows that do have one.
//
// Approve / reject / cancel / execute all go through the generic
// /api/approval-requests/:id/... endpoints directly — same as
// LEAVE_REQUEST, STUDENT_TRANSFER, INVOICE_VOID, and PAYMENT_VOID, none of
// which expose their own decision endpoints either. This module only owns
// submission and the expense-specific read views.
export async function submitExpense(data, schoolId, userId) {
    validateAmount(data.amount);
    const category = await findOwnedActiveCategoryOrThrow(data.category_id, schoolId);
    await findOwnedActiveAcademicYearOrThrow(data.academic_year_id, schoolId);

    // Inserted before the approval chain exists so entity_id has a real
    // row to point at — same ordering as leave-request.service.js.
    const expenseId = await expenseRepository.create(
        {
            school_id: schoolId,
            category_id: category.id,
            academic_year_id: data.academic_year_id,
            title: data.title,
            description: data.description,
            amount: data.amount,
            expense_date: data.expense_date,
            vendor_name: data.vendor_name,
            payment_method: data.payment_method,
            reference_number: data.reference_number
        },
        userId
    );

    const approvalRequest = await createApprovalRequest(
        {
            workflow_type: 'EXPENSE_APPROVAL',
            entity_type: 'Expense',
            entity_id: expenseId,
            title: `Expense: ${data.title} (${data.amount})`,
            description: data.description || EXPENSE_MESSAGES.SUBMITTED,
            steps: [{ approver_role_name: 'Administrator' }]
        },
        schoolId,
        userId
    );

    await expenseRepository.attachApprovalRequest(expenseId, approvalRequest.id);

    return await expenseRepository.findById(expenseId);
}

export async function getExpenses(schoolId, filters) {
    return await expenseRepository.findAll(schoolId, filters);
}

export async function getExpenseById(id, schoolId) {
    return await findOwnedExpenseOrThrow(id, schoolId);
}

export async function getExpenseSummary(schoolId, academicYearId) {
    await findOwnedAcademicYearOrThrow(academicYearId, schoolId);

    return await expenseRepository.getSummary(schoolId, academicYearId);
}
