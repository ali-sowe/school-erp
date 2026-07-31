import test from 'node:test';
import assert from 'node:assert/strict';
import * as bookService from '../services/library/book.service.js';
import * as copyService from '../services/library/copy.service.js';
import * as borrowService from '../services/library/borrow.service.js';

const serviceFunctionsToCheck = [
    [bookService, 'createBook', [{ title: 'Things Fall Apart' }, 1, 1]],
    [bookService, 'getBooks', [1, {}]],
    [bookService, 'getBookById', [1, 1]],
    [bookService, 'updateBook', [1, { title: 'Updated Title' }, 1, 1]],
    [bookService, 'archiveBook', [1, 1, 1]],
    [bookService, 'restoreBook', [1, 1, 1]],
    [copyService, 'addCopies', [1, { quantity: 1 }, 1, 1]],
    [copyService, 'getCopiesForBook', [1, undefined, 1]],
    [copyService, 'withdrawCopy', [1, 'Damaged beyond repair', 1, 1]],
    [copyService, 'restoreCopy', [1, 1, 1]],
    [borrowService, 'borrowBook', [1, { student_id: 1, due_date: '2026-02-01', borrowed_date: '2026-01-01' }, 1, 1]],
    [borrowService, 'returnBook', [1, { condition: 'GOOD' }, 1, 1]],
    [borrowService, 'getBorrowRecords', [1, {}]],
    [borrowService, 'getBorrowRecordById', [1, 1]],
    [borrowService, 'getStudentBorrowHistory', [1, {}, 1]]
];

test('library services export the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: attendance-module.wiring.test.js).
test('library services do not throw a ReferenceError (imports are wired correctly)', async () => {
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
