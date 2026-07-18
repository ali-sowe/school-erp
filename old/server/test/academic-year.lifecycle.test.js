import test from 'node:test';
import assert from 'node:assert/strict';
import { processAcademicYearLifecycle } from '../services/academic-year/academic-year.lifecycle.service.js';

test('processAcademicYearLifecycle is exported as a function', () => {
  assert.equal(typeof processAcademicYearLifecycle, 'function');
});
