import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counter';
import authReducer from './auth';
import expensesReducer from './expenses';
import themeReducer from './theme';

const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    expenses: expensesReducer,
    theme: themeReducer,
  },
});

export { counterActions } from './counter';
export { authActions } from './auth';
export { expensesActions } from './expenses';
export { themeActions } from './theme';

export default store;
