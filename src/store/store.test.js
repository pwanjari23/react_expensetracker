import { describe, test, expect } from 'vitest';
import counterReducer, { counterActions } from './counter';
import authReducer, { authActions } from './auth';
import themeReducer, { themeActions } from './theme';
import cartReducer, { cartActions } from './cart';

describe('Redux Toolkit Slice Reducers', () => {
  // --- Counter Slice Tests ---
  test('counter slice increments the value by 1', () => {
    const initialState = { counter: 0, showCounter: true };
    const nextState = counterReducer(initialState, counterActions.increment());
    expect(nextState.counter).toBe(1);
  });

  test('counter slice decreases the value by a custom amount', () => {
    const initialState = { counter: 10, showCounter: true };
    const nextState = counterReducer(initialState, counterActions.decrease(5));
    expect(nextState.counter).toBe(5);
  });

  // --- Auth Slice Tests ---
  test('auth slice stores authentication state and token details on login', () => {
    const initialState = { token: null, userId: null, isAuthenticated: false };
    const loginPayload = { token: 'mock-token', userId: 'user-123' };
    const nextState = authReducer(initialState, authActions.login(loginPayload));
    
    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.token).toBe('mock-token');
    expect(nextState.userId).toBe('user-123');
  });

  test('auth slice wipes status and token credentials on logout', () => {
    const filledState = { token: 'active-token', userId: 'user-999', isAuthenticated: true };
    const nextState = authReducer(filledState, authActions.logout());
    
    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.token).toBe(null);
    expect(nextState.userId).toBe(null);
  });

  // --- Theme Slice Tests ---
  test('theme slice activates premium flags correctly', () => {
    const initialState = { isPremium: false, isDark: false };
    const nextState = themeReducer(initialState, themeActions.activatePremium());
    
    expect(nextState.isPremium).toBe(true);
  });

  test('theme slice toggles between dark and light themes', () => {
    const initialState = { isPremium: true, isDark: false };
    const nextState = themeReducer(initialState, themeActions.toggleTheme());
    
    expect(nextState.isDark).toBe(true);
  });

  // --- Cart Slice Tests ---
  test('cart slice toggles cartIsVisible status', () => {
    const initialState = { cartIsVisible: false, items: [], changed: false };
    const nextState = cartReducer(initialState, cartActions.toggle());
    
    expect(nextState.cartIsVisible).toBe(true);
  });
});
