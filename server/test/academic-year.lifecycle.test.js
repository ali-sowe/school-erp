import test from 'node:test';
import assert from 'node:assert/strict';
import { processAcademicYearLifecycle } from '../services/academic-year/academic-year.lifecycle.service.js';
import { requestAcademicYearOverride } from '../services/academic-year/academic-year.service.js';

test('processAcademicYearLifecycle is exported as a function', () => {
  assert.equal(typeof processAcademicYearLifecycle, 'function');
});

test('processAcademicYearLifecycle does not throw a ReferenceError (imports are wired correctly)', async () => {
  // A missing DB connection (ECONNREFUSED) is expected without MySQL running.
  // A ReferenceError means a broken/missing import — the exact bug class that
  // slipped past the test above, since typeof-checking never executes the body.
  try {
    await processAcademicYearLifecycle();
  } catch (error) {
    assert.notEqual(
      error.constructor.name,
      'ReferenceError',
      `processAcademicYearLifecycle threw a ReferenceError, likely a missing import: ${error.message}`
    );
  }
});

test('requestAcademicYearOverride is exported as a function', () => {
  assert.equal(typeof requestAcademicYearOverride, 'function');
});

// Same ReferenceError guard as above — this one specifically covers the new
// approval-engine wiring (createApprovalRequest / registerWorkflowExecutor
// imports added for the ACADEMIC_YEAR_OVERRIDE workflow type).
test('requestAcademicYearOverride does not throw a ReferenceError (imports are wired correctly)', async () => {
  try {
    await requestAcademicYearOverride(1, { reason: 'Testing wiring' }, 1, 1);
  } catch (error) {
    assert.notEqual(
      error.constructor.name,
      'ReferenceError',
      `requestAcademicYearOverride threw a ReferenceError, likely a missing import: ${error.message}`
    );
  }
});
