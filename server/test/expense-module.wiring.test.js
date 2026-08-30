import test from 'node:test';
import assert from 'node:assert/strict';
import * as expenseCategoryService from '../services/expense/expense-category.service.js';
import * as expenseService from '../services/expense/expense.service.js';

const serviceFunctionsToCheck = [
    [expenseCategoryService, 'createExpenseCategory', [{ name: 'Utilities' }, 1, 1]],
    [expenseCategoryService, 'getExpenseCategories', [1]],
    [expenseCategoryService, 'getExpenseCategoryById', [1, 1]],
    [expenseCategoryService, 'updateExpenseCategory', [1, { name: 'Utilities & Power' }, 1, 1]],
    [expenseCategoryService, 'archiveExpenseCategory', [1, 1, 1]],
    [expenseCategoryService, 'restoreExpenseCategory', [1, 1, 1]],
    [expenseService, 'submitExpense', [{ category_id: 1, academic_year_id: 1, title: 'Generator fuel', amount: 500, expense_date: '2026-01-10' }, 1, 1]],
    [expenseService, 'getExpenses', [1, {}]],
    [expenseService, 'getExpenseById', [1, 1]],
    [expenseService, 'getExpenseSummary', [1, 1]]
];

test('expense tracker module services export the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: finance-module.wiring.test.js, leave-request-module.wiring.test.js).
test('expense tracker module services do not throw a ReferenceError (imports are wired correctly)', async () => {
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

// The 'expenses' report dataset should be registered as a side effect of
// importing report.service.js — same check style as report-module.wiring
// for other datasets, guarding against the registration import being
// dropped silently.
test('expenses report dataset is registered with the report engine', async () => {
    const { getAvailableReports } = await import('../services/report/report.service.js');
    const datasets = getAvailableReports(['expenses.read']);

    assert.ok(
        datasets.some((dataset) => dataset.key === 'expenses'),
        'expected an "expenses" dataset to be registered with the report engine'
    );
});
