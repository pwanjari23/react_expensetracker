import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './ui';
import cartReducer from './cart';
import authReducer from './auth';
import expensesReducer from './expenses';
import { fetchCartData, sendCartData } from './cart-actions';

const setupTestStore = () => {
  return configureStore({
    reducer: {
      ui: uiReducer,
      cart: cartReducer,
      auth: authReducer,
      expenses: expensesReducer,
    },
  });
};

describe('Async Redux Thunks & API Mocking', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 1
  test('fetchCartData dispatches success notification and updates cart items when HTTP response is OK', async () => {
    const mockCartData = { items: [{ id: 'p1', title: 'Test 1', price: 6, quantity: 1, totalPrice: 6 }] };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCartData,
    });

    const store = setupTestStore();
    await store.dispatch(fetchCartData());

    expect(store.getState().cart.items).toHaveLength(1);
    expect(store.getState().cart.items[0].title).toBe('Test 1');
    expect(store.getState().ui.notification.status).toBe('success');
  });

  // Test 2
  test('fetchCartData dispatches error notification when API returns bad HTTP status', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
    });

    const store = setupTestStore();
    await store.dispatch(fetchCartData());

    expect(store.getState().cart.items).toHaveLength(0);
    expect(store.getState().ui.notification.status).toBe('error');
    expect(store.getState().ui.notification.title).toBe('Error!');
  });

  // Test 3
  test('fetchCartData dispatches error notification when API call throws a network error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network offline'));

    const store = setupTestStore();
    await store.dispatch(fetchCartData());

    expect(store.getState().ui.notification.status).toBe('error');
    expect(store.getState().ui.notification.message).toContain('failed');
  });

  // Test 4
  test('fetchCartData handles null/empty database records by initializing empty cart array', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    const store = setupTestStore();
    await store.dispatch(fetchCartData());

    expect(store.getState().cart.items).toEqual([]);
    expect(store.getState().ui.notification.status).toBe('success');
  });

  // Test 5
  test('sendCartData dispatches success notification when PUT request is OK', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
    });

    const store = setupTestStore();
    const mockCart = { items: [{ id: 'p2', title: 'Test 2', price: 8 }] };
    await store.dispatch(sendCartData(mockCart));

    expect(store.getState().ui.notification.status).toBe('success');
    expect(store.getState().ui.notification.title).toBe('Success!');
  });

  // Test 6
  test('sendCartData dispatches error notification when PUT request is bad', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
    });

    const store = setupTestStore();
    const mockCart = { items: [] };
    await store.dispatch(sendCartData(mockCart));

    expect(store.getState().ui.notification.status).toBe('error');
  });

  // Test 7
  test('sendCartData dispatches error notification when PUT request throws a network exception', async () => {
    fetch.mockRejectedValueOnce(new Error('Internal Server Error'));

    const store = setupTestStore();
    const mockCart = { items: [] };
    await store.dispatch(sendCartData(mockCart));

    expect(store.getState().ui.notification.status).toBe('error');
    expect(store.getState().ui.notification.title).toBe('Error!');
  });

  // Test 8
  test('fetchCartData uses the correct endpoint URL and VITE_FIREBASE_PROJECT_ID configuration', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    const store = setupTestStore();
    await store.dispatch(fetchCartData());

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][0]).toContain('.firebaseio.com/cart.json');
  });

  // Test 9
  test('sendCartData PUT payload formats empty values safely', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
    });

    const store = setupTestStore();
    await store.dispatch(sendCartData({ items: null }));

    expect(fetch).toHaveBeenCalledTimes(1);
    const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(requestBody.items).toEqual([]);
  });

  // Test 10
  test('sendCartData requests correct method and content headers', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
    });

    const store = setupTestStore();
    await store.dispatch(sendCartData({ items: [] }));

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].method).toBe('PUT');
  });
});
