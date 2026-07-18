import test from 'node:test';
import assert from 'node:assert/strict';
import * as studentService from '../services/student/student.service.js';
import * as guardianService from '../services/student/guardian.service.js';
import * as enrollmentService from '../services/student/enrollment.service.js';

const serviceFunctionsToCheck = [
    [studentService, 'createStudent', [{ first_name: 'Amie', last_name: 'Jallow' }, 1, 1]],
    [studentService, 'getStudents', [1]],
    [guardianService, 'createGuardian', [{ first_name: 'Lamin', last_name: 'Jallow' }, 1, 1]],
    [guardianService, 'getGuardians', [1]],
    [guardianService, 'linkGuardianToStudent', [1, 1, { relationship: 'Father' }, 1, 1]],
    [enrollmentService, 'enrollStudent', [1, { class_id: 1 }, 1, 1]],
    [enrollmentService, 'getRoster', [1, undefined, 1]]
];

test('student, guardian, and enrollment services export the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: class-module.wiring.test.js).
test('student, guardian, and enrollment services do not throw a ReferenceError (imports are wired correctly)', async () => {
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
