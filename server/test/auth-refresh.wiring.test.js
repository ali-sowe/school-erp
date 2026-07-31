import test from 'node:test';
import assert from 'node:assert/strict';
import * as authService from '../services/auth/auth.service.js';

const serviceFunctionsToCheck = [
    [authService, 'refreshAccessToken', ['some-raw-refresh-token']],
    [authService, 'logoutAllDevices', [1]]
];

test('auth refresh-token functions are exported', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — the same bug class every other
// *-module.wiring.test.js in this suite guards against.
test('auth refresh-token functions do not throw a ReferenceError (imports are wired correctly)', async () => {
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
