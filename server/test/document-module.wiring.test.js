import test from 'node:test';
import assert from 'node:assert/strict';
import * as documentService from '../services/document/document.service.js';

const fakeUploadedFile = {
    originalname: 'circular.pdf',
    filename: 'fake-uuid.pdf',
    path: '/tmp/fake-uuid.pdf',
    mimetype: 'application/pdf',
    size: 1024
};

const serviceFunctionsToCheck = [
    [documentService, 'uploadDocument', [fakeUploadedFile, { title: 'Circular' }, 1, 1]],
    [documentService, 'getDocuments', [1, {}]],
    [documentService, 'getDocumentById', [1, 1]],
    [documentService, 'getDownloadDetails', [1, 1]],
    [documentService, 'getPreviewDetails', [1, 1]],
    [documentService, 'reprocessDocument', [1, 1]],
    [documentService, 'searchDocuments', [1, 'circular', {}]],
    [documentService, 'updateDocument', [1, { title: 'Updated Circular' }, 1, 1]],
    [documentService, 'archiveDocument', [1, 1, 1]],
    [documentService, 'restoreDocument', [1, 1, 1]]
];

test('document services export the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: attendance-module.wiring.test.js).
test('document services do not throw a ReferenceError (imports are wired correctly)', async () => {
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
