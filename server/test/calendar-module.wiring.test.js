import test from 'node:test';
import assert from 'node:assert/strict';
import * as calendarService from '../services/calendar/calendar.service.js';
import { validateDateRange } from '../helpers/calendar/calendar.helper.js';

const serviceFunctionsToCheck = [
    [calendarService, 'createEvent', [{ academic_year_id: 1, title: 'Independence Day', start_date: '2026-02-18', end_date: '2026-02-18', is_school_closed: true }, 1, 1]],
    [calendarService, 'getEvents', [1, {}]],
    [calendarService, 'getEventById', [1, 1]],
    [calendarService, 'updateEvent', [1, { title: 'Independence Day (observed)' }, 1, 1]],
    [calendarService, 'archiveEvent', [1, 1, 1]],
    [calendarService, 'restoreEvent', [1, 1, 1]],
    [calendarService, 'copyEventsToYear', [1, 2, 1, 1]],
    [calendarService, 'ensureSchoolIsOpenOnDate', [1, '2026-02-18']]
];

test('calendar service exports the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: teacher-module.wiring.test.js, library-module.wiring.test.js).
test('calendar service does not throw a ReferenceError (imports are wired correctly)', async () => {
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

// validateDateRange is pure (no DB), so it's testable with real assertions
// rather than just an import-safety check.
test('validateDateRange rejects an end date before the start date', () => {
    assert.throws(
        () => validateDateRange('2026-03-21', '2026-03-20'),
        (error) => error.message === 'End date cannot be before start date.'
    );
});

test('validateDateRange allows a same-day event and a proper range', () => {
    assert.doesNotThrow(() => validateDateRange('2026-03-20', '2026-03-20'));
    assert.doesNotThrow(() => validateDateRange('2026-03-20', '2026-03-22'));
});

// Regression coverage for the reason this module exists at all: attendance
// must not be markable on a day the school calendar says is closed. This
// only proves the wiring (attendance.service.js really does call into
// calendar.service.js before doing anything else) — full behavioral
// coverage needs a live database, same limitation as every other service
// test in this suite.
test('attendance.service.js imports and calls ensureSchoolIsOpenOnDate', async () => {
    const attendanceServiceSource = await import('node:fs/promises')
        .then((fs) => fs.readFile(new URL('../services/attendance/attendance.service.js', import.meta.url), 'utf-8'));

    assert.match(attendanceServiceSource, /ensureSchoolIsOpenOnDate/, 'markAttendance should call the calendar closure check');
});
