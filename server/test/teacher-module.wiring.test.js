import test from 'node:test';
import assert from 'node:assert/strict';
import * as teacherService from '../services/teacher/teacher.service.js';
import * as teacherSubjectAssignmentService from '../services/teacher/teacher-subject-assignment.service.js';
import * as classTeacherService from '../services/teacher/class-teacher.service.js';

const serviceFunctionsToCheck = [
    [teacherService, 'createTeacher', [{ first_name: 'A', last_name: 'B', email: 'a@b.com', password: 'password1' }, 1, 1]],
    [teacherService, 'getTeachers', [1, {}]],
    [teacherService, 'getTeacherById', [1, 1]],
    [teacherService, 'updateTeacher', [1, { qualification: 'BSc' }, 1, 1]],
    [teacherService, 'archiveTeacher', [1, 1, 1]],
    [teacherService, 'restoreTeacher', [1, 1, 1]],
    [teacherSubjectAssignmentService, 'assignTeacher', [{ teacher_id: 1, class_id: 1, subject_id: 1 }, 1, 1]],
    [teacherSubjectAssignmentService, 'getAssignmentsForClass', [1, undefined, 1]],
    [teacherSubjectAssignmentService, 'getAssignmentsForTeacher', [1, undefined, 1]],
    [teacherSubjectAssignmentService, 'endAssignment', [1, 1, 1]],
    [classTeacherService, 'assignClassTeacher', [{ teacher_id: 1, class_id: 1 }, 1, 1]],
    [classTeacherService, 'getClassTeacher', [1, undefined, 1]],
    [classTeacherService, 'getClassesForTeacher', [1, 1]],
    [classTeacherService, 'endClassTeacherAssignment', [1, 1, 1]]
];

test('teacher module services export the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: attendance-module.wiring.test.js).
test('teacher module services do not throw a ReferenceError (imports are wired correctly)', async () => {
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
