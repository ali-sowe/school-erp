import test from 'node:test';
import assert from 'node:assert/strict';
import * as gradeLevelService from '../services/grade-level/grade-level.service.js';
import * as subjectService from '../services/subject/subject.service.js';
import * as classService from '../services/class/class.service.js';

const serviceFunctionsToCheck = [
    [gradeLevelService, 'createGradeLevel', [{ name: 'Grade 7', education_level: 'UPPER_BASIC' }, 1, 1]],
    [gradeLevelService, 'getGradeLevels', [1]],
    [subjectService, 'createSubject', [{ name: 'Mathematics', code: 'MATH' }, 1, 1]],
    [subjectService, 'getSubjects', [1]],
    [classService, 'createClass', [{ grade_level_id: 1, name: 'A' }, 1, 1]],
    [classService, 'getClasses', [1]],
    [classService, 'getClassSubjects', [1, 1]]
];

test('grade-level, subject, and class services export the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: academic-year.lifecycle.test.js, term.lifecycle.test.js).
test('grade-level, subject, and class services do not throw a ReferenceError (imports are wired correctly)', async () => {
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
