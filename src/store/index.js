import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counter';
import authReducer from './auth';
import expensesReducer from './expenses';

const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    expenses: expensesReducer,
  },
});

export { counterActions } from './counter';
export { authActions } from './auth';
export { expensesActions } from './expenses';

export default store;
