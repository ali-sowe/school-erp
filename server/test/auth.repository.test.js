import test from 'node:test';
import assert from 'node:assert/strict';
import { validateUser } from '../repositories/auth/auth.repository.js';
import { logout } from '../services/auth/auth.service.js';
import { AppError } from '../helpers/app-error.helper.js';
import { AUTH_MESSAGES } from '../constants/messages/auth.message.js';
import { HTTP_STATUS } from '../constants/httpstatus.js';

test('validateUser throws AppError for missing user', () => {
  assert.throws(() => validateUser(null), (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.status, HTTP_STATUS.UNAUTHORIZED);
    assert.equal(error.message, AUTH_MESSAGES.INVALID_CREDENTIALS);
    return true;
  });
});

test('logout returns a success payload', async () => {
  const result = await logout(42);
  assert.deepEqual(result, { message: AUTH_MESSAGES.LOGOUT_SUCCESS });
});
