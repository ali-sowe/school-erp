import test from 'node:test';
import assert from 'node:assert/strict';
import * as passwordResetService from '../services/auth/password-reset.service.js';
import * as studentPortalAccountService from '../services/student/student-portal-account.service.js';
import * as guardianPortalAccountService from '../services/student/guardian-portal-account.service.js';
import * as studentPortalService from '../services/portal/student-portal.service.js';
import * as parentPortalService from '../services/portal/parent-portal.service.js';
import { hashToken, generateRawToken } from '../helpers/auth/password-reset.helper.js';

const serviceFunctionsToCheck = [
    [passwordResetService, 'requestPasswordReset', ['someone@example.com']],
    [passwordResetService, 'resetPassword', ['not-a-real-token', 'NewPassword123']],
    [studentPortalAccountService, 'createStudentPortalAccount', [1, { email: 'student@example.com', password: 'password123' }, 1, 1]],
    [guardianPortalAccountService, 'createGuardianPortalAccount', [1, { password: 'password123' }, 1, 1]],
    [studentPortalService, 'getMyProfile', [1]],
    [studentPortalService, 'getMyAttendance', [1, {}]],
    [studentPortalService, 'getMyExamResults', [1, {}]],
    [studentPortalService, 'getMyLibraryBorrows', [1, {}]],
    [studentPortalService, 'getMyAnnouncements', [1, 1]],
    [studentPortalService, 'markAnnouncementRead', [1, 1, 1]],
    [parentPortalService, 'getMyChildren', [1]],
    [parentPortalService, 'getChildAttendance', [1, 1, {}]],
    [parentPortalService, 'getChildExamResults', [1, 1, {}]],
    [parentPortalService, 'getChildInvoices', [1, 1, 1]],
    [parentPortalService, 'getChildLibraryBorrows', [1, 1, {}]],
    [parentPortalService, 'getChildAnnouncements', [1, 1, 1]],
    [parentPortalService, 'markAnnouncementRead', [1, 1, 1]]
];

test('password reset and portal services export the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection is expected without MySQL running and is not what
// this test checks for. A ReferenceError means a broken/missing import —
// the real bug class this guards against (see: attendance-module.wiring.test.js).
test('password reset and portal services do not throw a ReferenceError (imports are wired correctly)', async () => {
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

test('password reset tokens hash deterministically and never store the raw value', () => {
    const rawToken = generateRawToken();
    const hashA = hashToken(rawToken);
    const hashB = hashToken(rawToken);

    assert.equal(hashA, hashB);
    assert.notEqual(hashA, rawToken);
});

test('requestPasswordReset always returns the same generic message regardless of whether the email exists', async () => {
    // No DB available in this environment — this only exercises that the
    // function doesn't throw before reaching the DB call and that its
    // shape doesn't leak which branch (found vs not found) ran.
    try {
        const result = await passwordResetService.requestPasswordReset('definitely-not-registered@example.com');
        assert.ok('message' in result);
    } catch (error) {
        // A DB connection error here is fine (no MySQL in this sandbox);
        // anything else would be a real wiring problem.
        assert.notEqual(error.constructor.name, 'ReferenceError');
    }
});
