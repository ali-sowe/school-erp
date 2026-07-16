import test from 'node:test';
import assert from 'node:assert/strict';
import { createUser } from '../services/user/user.service.js';
import { createRole } from '../services/role/role.service.js';
import { AppError } from '../helpers/app-error.helper.js';
import { ensureCoreTables } from '../database/schema.js';

test('createRole returns a role object', async () => {
  await ensureCoreTables();
  const roleName = `Registrar-${Date.now()}`;
  const role = await createRole({ role_name: roleName, description: 'School registrar', permissions: ['students.read'] });
  assert.ok(role);
  assert.equal(role.role_name, roleName);
});

test('createUser rejects duplicate emails', async () => {
  await ensureCoreTables();
  const roleName = `Registrar-${Date.now() + 1}`;
  const role = await createRole({ role_name: roleName, description: 'School registrar', permissions: ['students.read'] });
  const duplicateEmail = `dup-${Date.now()}@example.com`;

  await createUser({
    email: duplicateEmail,
    password: 'Password123!',
    first_name: 'Test',
    last_name: 'User',
    role_id: role.id
  });

  await assert.rejects(
    () => createUser({
      email: duplicateEmail,
      password: 'Password123!',
      first_name: 'Duplicate',
      last_name: 'User',
      role_id: role.id
    }),
    (error) => {
      assert.ok(error instanceof AppError);
      return true;
    }
  );
});
