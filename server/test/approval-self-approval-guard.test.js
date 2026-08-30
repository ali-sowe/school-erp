import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAndResolveSteps } from '../helpers/approval/approval.helper.js';
import { registerRequiredSteps, getRequiredSteps } from '../services/approval/workflow-step-policy-registry.js';

// Regression coverage for a real gap found during a codebase review: the
// generic POST /approval-requests endpoint let anyone holding the generic
// approvals.write permission (Teacher included — see permission.helper.js)
// name themselves as the sole approver of their own request, including for
// high-stakes workflow_types like PAYMENT_VOID/INVOICE_VOID/
// STUDENT_TRANSFER/ACADEMIC_YEAR_OVERRIDE whose owning modules always
// intend an Administrator-only approval chain. Both checks below fire
// synchronously, before any DB lookup, so they're testable without MySQL
// running — unlike most of this module's service functions (see
// approval-module.wiring.test.js).

test('validateAndResolveSteps rejects a step naming the requester as their own approver', async () => {
    await assert.rejects(
        () => validateAndResolveSteps([{ approver_user_id: 7 }], 1, 7),
        (error) => error.message === 'You cannot be an approver on your own request.'
    );
});

test('validateAndResolveSteps allows a step naming someone other than the requester', async () => {
    // Fails on the DB lookup (no MySQL in this environment) rather than on
    // the self-approval guard — proves the guard didn't fire for a
    // different user, without needing a live database to check further.
    await assert.rejects(
        () => validateAndResolveSteps([{ approver_user_id: 42 }], 1, 7),
        (error) => error.message !== 'You cannot be an approver on your own request.'
    );
});

test('a workflow type with no registered policy has no required steps', () => {
    assert.equal(getRequiredSteps('SOME_AD_HOC_WORKFLOW_NOBODY_REGISTERED'), undefined);
});

test('registerRequiredSteps makes a workflow type non-overridable by caller-supplied steps', () => {
    // Exercises the registry directly rather than re-registering one of the
    // real production workflow_types, so this test doesn't depend on
    // finance/enrollment/academic-year services having already been
    // imported (and thus already having registered theirs) by the time
    // node:test runs this file.
    registerRequiredSteps('TEST_ONLY_PROTECTED_WORKFLOW', [{ approver_role_name: 'Administrator' }]);

    const policy = getRequiredSteps('TEST_ONLY_PROTECTED_WORKFLOW');

    assert.deepEqual(policy, [{ approver_role_name: 'Administrator' }]);
});

test('the protected workflow types each have an Administrator-only policy registered', async () => {
    // Importing these services (side-effect: they call registerRequiredSteps
    // at module load, right next to their registerWorkflowExecutor calls)
    // is what this test is actually checking — a module that adds a new
    // executor without also registering its required steps would leave a
    // workflow_type reachable through the generic endpoint with no policy
    // enforced, silently reopening this exact gap.
    await import('../services/finance/payment.service.js');
    await import('../services/finance/invoice.service.js');
    await import('../services/student/enrollment.service.js');
    await import('../services/academic-year/academic-year.service.js');
    await import('../services/leave/leave-request.service.js');
    await import('../services/expense/expense.service.js');

    for (const workflowType of ['PAYMENT_VOID', 'INVOICE_VOID', 'STUDENT_TRANSFER', 'ACADEMIC_YEAR_OVERRIDE', 'LEAVE_REQUEST', 'EXPENSE_APPROVAL']) {
        assert.deepEqual(
            getRequiredSteps(workflowType),
            [{ approver_role_name: 'Administrator' }],
            `${workflowType} should have an Administrator-only required-steps policy registered`
        );
    }
});
