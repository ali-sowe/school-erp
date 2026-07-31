import test from 'node:test';
import assert from 'node:assert/strict';
import * as importBatchService from '../services/data-import/import-batch.service.js';
import { getDataImporter } from '../services/data-import/importer-registry.js';

const serviceFunctionsToCheck = [
    [importBatchService, 'createImportBatch', [1, 'STUDENTS', {}, 1, 1]],
    [importBatchService, 'getImportBatches', [1, {}]],
    [importBatchService, 'getImportBatchById', [1, 1]],
    [importBatchService, 'getImportBatchRows', [1, 1, {}]],
    [importBatchService, 'confirmImportBatch', [1, 1, 1]],
    [importBatchService, 'cancelImportBatch', [1, 1, 1]]
];

test('data-import services export the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

test('getAvailableImportTypes is exported as a function', () => {
    assert.equal(typeof importBatchService.getAvailableImportTypes, 'function');
});

// Importing import-batch.service.js side-effect-registers every importer
// (see importers/*.importer.js) — this catches any of those registrations
// silently failing to wire up, separately from the generic ReferenceError
// check below.
test('all expected importers are registered with the expected shape', () => {
    for (const targetType of ['STUDENTS', 'TEACHERS', 'EXAM_MARKS', 'FEE_STRUCTURES', 'ATTENDANCE']) {
        const importer = getDataImporter(targetType);
        assert.ok(importer, `${targetType} importer should be registered`);
        assert.equal(typeof importer.validateRow, 'function', `${targetType} validateRow should be a function`);
        assert.equal(typeof importer.importRow, 'function', `${targetType} importRow should be a function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: attendance-module.wiring.test.js).
test('data-import services do not throw a ReferenceError (imports are wired correctly)', async () => {
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
