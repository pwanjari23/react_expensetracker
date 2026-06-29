import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './counter';
import authReducer from './auth';
import expensesReducer from './expenses';
import themeReducer from './theme';
import cartReducer from './cart';

const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authReducer,
    expenses: expensesReducer,
    theme: themeReducer,
    cart: cartReducer,
  },
});

export { counterActions } from './counter';
export { authActions } from './auth';
export { expensesActions } from './expenses';
export { themeActions } from './theme';
export { cartActions } from './cart';

export default store;
