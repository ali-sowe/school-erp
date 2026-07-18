import test from 'node:test';
import assert from 'node:assert/strict';
import * as attendanceService from '../services/attendance/attendance.service.js';

const serviceFunctionsToCheck = [
    [attendanceService, 'markAttendance', [1, { date: '2026-01-10', entries: [{ student_id: 1, status: 'PRESENT' }] }, 1, 1]],
    [attendanceService, 'getClassAttendanceForDate', [1, '2026-01-10', undefined, 1]],
    [attendanceService, 'getStudentAttendanceHistory', [1, {}, 1]],
    [attendanceService, 'updateAttendanceRecord', [1, { status: 'ABSENT' }, 1, 1]],
    [attendanceService, 'getClassAttendanceSummary', [1, {}, 1]]
];

test('attendance service exports the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: student-module.wiring.test.js, class-module.wiring.test.js).
test('attendance service does not throw a ReferenceError (imports are wired correctly)', async () => {
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
