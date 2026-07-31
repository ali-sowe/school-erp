import test from 'node:test';
import assert from 'node:assert/strict';
import * as leaveRequestService from '../services/leave/leave-request.service.js';

const serviceFunctionsToCheck = [
    [leaveRequestService, 'requestLeave', [{ leave_type: 'SICK', start_date: '2026-08-01', end_date: '2026-08-02' }, 1, 1]],
    [leaveRequestService, 'getLeaveRequests', [1, {}]],
    [leaveRequestService, 'getMyLeaveRequests', [1, 1, {}]],
    [leaveRequestService, 'getLeaveRequestById', [1, 1]]
];

test('leave request service exports the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: attendance-module.wiring.test.js).
test('leave request service does not throw a ReferenceError (imports are wired correctly)', async () => {
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
