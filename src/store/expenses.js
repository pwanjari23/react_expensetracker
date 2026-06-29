import { createSlice } from '@reduxjs/toolkit';

const initialExpensesState = {
  expenses: [],
};

const expensesSlice = createSlice({
  name: 'expenses',
  initialState: initialExpensesState,
  reducers: {
    setExpenses(state, action) {
      state.expenses = action.payload;
    },
    addExpense(state, action) {
      state.expenses = [action.payload, ...state.expenses];
    },
    updateExpense(state, action) {
      state.expenses = state.expenses.map((exp) =>
        exp.id === action.payload.id ? action.payload : exp
      );
    },
    deleteExpense(state, action) {
      state.expenses = state.expenses.filter((exp) => exp.id !== action.payload);
    },
  },
});

export const expensesActions = expensesSlice.actions;
export default expensesSlice.reducer;
