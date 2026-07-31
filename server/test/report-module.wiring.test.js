import test from 'node:test';
import assert from 'node:assert/strict';
import * as reportService from '../services/report/report.service.js';

const serviceFunctionsToCheck = [
    [reportService, 'getAvailableReports', [['students.read', 'teachers.read']]],
    [reportService, 'generateReport', ['students', 'xlsx', 1, ['students.read'], {}]]
];

test('report module service exports the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection is expected without MySQL running and is not what
// this test checks for. A ReferenceError means a broken/missing import —
// the real bug class this guards against (see: attendance-module.wiring.test.js).
test('report module service does not throw a ReferenceError (imports are wired correctly)', async () => {
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

test('getAvailableReports only returns datasets the given permissions allow', () => {
    const withNoPermissions = reportService.getAvailableReports([]);
    assert.deepEqual(withNoPermissions, []);

    const withStudentsOnly = reportService.getAvailableReports(['students.read']);
    assert.ok(withStudentsOnly.some((dataset) => dataset.key === 'students'));
    assert.ok(!withStudentsOnly.some((dataset) => dataset.key === 'invoices'));
});
