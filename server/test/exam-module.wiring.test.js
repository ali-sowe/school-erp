import test from 'node:test';
import assert from 'node:assert/strict';
import * as examService from '../services/exam/exam.service.js';
import * as examResultService from '../services/exam/exam-result.service.js';

const serviceFunctionsToCheck = [
    [examService, 'createExam', [{ class_id: 1, academic_year_id: 1, term_id: 1, name: 'End of Term Exam', planned_start_date: '2028-12-01', planned_end_date: '2028-12-05' }, 1, 1]],
    [examService, 'getExams', [1, {}]],
    [examService, 'addExamSubject', [1, 1, 100, 1, 1]],
    [examService, 'removeExamSubject', [1, 1, 1, 1]],
    [examService, 'getExamSubjects', [1, 1]],
    [examService, 'startExam', [1, 1, 1]],
    [examService, 'completeExam', [1, 1, 1]],
    [examService, 'reopenExam', [1, 'Marking error found', 1, 1]],
    [examResultService, 'recordResults', [1, { subject_id: 1, entries: [{ student_id: 1, score: 85 }] }, 1, 1]],
    [examResultService, 'getResultsForExam', [1, null, 1]],
    [examResultService, 'getStudentResults', [1, {}, 1]],
    [examResultService, 'updateExamResult', [1, { score: 90 }, 1, 1]],
    [examResultService, 'getExamSummary', [1, 1]]
];

test('exam module services export the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: teacher-module.wiring.test.js, finance-module.wiring.test.js).
test('exam module services do not throw a ReferenceError (imports are wired correctly)', async () => {
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
