import { describe, test, expect } from 'vitest';
import expensesReducer, { expensesActions } from './expenses';

describe('Expenses Reducer Slice', () => {
  test('returns initial state when action is undefined', () => {
    const state = expensesReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual({ expenses: [] });
  });

  test('setExpenses sets the entire list of expenses', () => {
    const list = [
      { id: '1', name: 'Coffee', amount: -3.5, category: 'Food', date: '2026-06-29' },
      { id: '2', name: 'Gas', amount: -45, category: 'Petrol', date: '2026-06-29' }
    ];
    const state = expensesReducer({ expenses: [] }, expensesActions.setExpenses(list));
    expect(state.expenses).toHaveLength(2);
    expect(state.expenses[0].name).toBe('Coffee');
  });

  test('addExpense appends a new expense at the beginning', () => {
    const item = { id: '3', name: 'Salary', amount: 3000, category: 'Others', date: '2026-06-29' };
    const state = expensesReducer({ expenses: [] }, expensesActions.addExpense(item));
    expect(state.expenses).toHaveLength(1);
    expect(state.expenses[0].name).toBe('Salary');
  });

  test('updateExpense updates a matching item by id', () => {
    const original = { id: '1', name: 'Coffee', amount: -3.5, category: 'Food', date: '2026-06-29' };
    const updated = { id: '1', name: 'Specialty Coffee', amount: -5.5, category: 'Food', date: '2026-06-29' };
    const state = expensesReducer({ expenses: [original] }, expensesActions.updateExpense(updated));
    expect(state.expenses[0].name).toBe('Specialty Coffee');
    expect(state.expenses[0].amount).toBe(-5.5);
  });

  test('deleteExpense removes the correct element by id', () => {
    const items = [
      { id: '1', name: 'Coffee', amount: -3.5, category: 'Food' },
      { id: '2', name: 'Gas', amount: -45, category: 'Petrol' }
    ];
    const state = expensesReducer({ expenses: items }, expensesActions.deleteExpense('1'));
    expect(state.expenses).toHaveLength(1);
    expect(state.expenses[0].id).toBe('2');
  });
});
