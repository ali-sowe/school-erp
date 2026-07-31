import test from 'node:test';
import assert from 'node:assert/strict';
import * as notificationService from '../services/notification/notification.service.js';

const serviceFunctionsToCheck = [
    [notificationService, 'notifyUsers', [[1], { schoolId: 1, type: 'MESSAGE', title: 'New message', body: 'Hello' }]],
    [notificationService, 'getNotificationsForUser', [1, {}]],
    [notificationService, 'getUnreadCount', [1]],
    [notificationService, 'markAsRead', [1, 1, 1]],
    [notificationService, 'markAllAsRead', [1]]
];

test('notification service exports the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: attendance-module.wiring.test.js, student-module.wiring.test.js).
test('notification service does not throw a ReferenceError (imports are wired correctly)', async () => {
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
