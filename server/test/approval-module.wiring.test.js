import test from 'node:test';
import assert from 'node:assert/strict';
import * as approvalService from '../services/approval/approval.service.js';

const serviceFunctionsToCheck = [
    [approvalService, 'createApprovalRequest', [
        { workflow_type: 'GENERIC', title: 'Test request', steps: [{ approver_user_id: 1 }] },
        1,
        1
    ]],
    [approvalService, 'getApprovalRequests', [1, {}]],
    [approvalService, 'getApprovalRequestById', [1, 1]],
    [approvalService, 'getMyPendingApprovals', [1, 1, 'Administrator']],
    [approvalService, 'approveCurrentStep', [1, 1, 1, 'Administrator', 'ok']],
    [approvalService, 'rejectCurrentStep', [1, 1, 1, 'Administrator', 'not ok']],
    [approvalService, 'executeApprovalRequest', [1, 1, 1, 'done']],
    [approvalService, 'cancelApprovalRequest', [1, 1, 1, 'no longer needed']]
];

test('approval module service exports the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: teacher-module.wiring.test.js).
test('approval module service does not throw a ReferenceError (imports are wired correctly)', async () => {
    for (const [serviceModule, functionName, args] of serviceFunctionsToCheck) {
        try {
            await serviceModule[functionName](...args);
        } catch (error) {
            assert.notEqual(
                error.constructor.name,
                'ReferenceError',
                `${functionName} threw a ReferenceError, likely a missing import: ${error.message}`
            );
        }
    }
});
