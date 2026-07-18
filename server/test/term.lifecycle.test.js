import test from 'node:test';
import assert from 'node:assert/strict';
import { processTermLifecycle } from '../services/term/term.lifecycle.service.js';

test('processTermLifecycle is exported as a function', () => {
  assert.equal(typeof processTermLifecycle, 'function');
});

test('processTermLifecycle does not throw a ReferenceError (imports are wired correctly)', async () => {
  // A missing DB connection (ECONNREFUSED) is expected in environments
  // without MySQL running and is not what this test is checking for.
  // A ReferenceError means a broken/missing import — that's the real bug class
  // this guards against (see: academic-year.lifecycle.service.js, July 2026).
  try {
    await processTermLifecycle();
  } catch (error) {
    assert.notEqual(
      error.constructor.name,
      'ReferenceError',
      `processTermLifecycle threw a ReferenceError, likely a missing import: ${error.message}`
    );
  }
});
