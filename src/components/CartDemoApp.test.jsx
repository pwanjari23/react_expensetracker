import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect } from 'vitest';
import CartDemoApp from './CartDemoApp';
import cartReducer from '../store/cart';
import uiReducer from '../store/ui';

const createMockStore = (initialState) => {
  return configureStore({
    reducer: {
      cart: cartReducer,
      ui: uiReducer,
    },
    preloadedState: initialState,
  });
};

describe('CartDemoApp Component UI and Interaction', () => {
  test('renders the main brand heading ReduxCart', () => {
    const store = createMockStore({
      cart: { cartIsVisible: false, items: [], changed: false },
      ui: { notification: null }
    });
    render(
      <Provider store={store}>
        <CartDemoApp />
      </Provider>
    );
    const brandEl = screen.getByText('ReduxCart');
    expect(brandEl).toBeDefined();
  });

  test('displays product catalog with favorite products header text', () => {
    const store = createMockStore({
      cart: { cartIsVisible: false, items: [], changed: false },
      ui: { notification: null }
    });
    render(
      <Provider store={store}>
        <CartDemoApp />
      </Provider>
    );
    const headerEl = screen.getByText('Buy Your Favorite Products');
    expect(headerEl).toBeDefined();
  });

  test('renders item buttons for catalog items', () => {
    const store = createMockStore({
      cart: { cartIsVisible: false, items: [], changed: false },
      ui: { notification: null }
    });
    render(
      <Provider store={store}>
        <CartDemoApp />
      </Provider>
    );
    const buttons = screen.getAllByRole('button', { name: /Add to Cart/i });
    expect(buttons.length).toBe(2);
  });

  test('toggles visibility of empty cart notification upon clicking My Cart', () => {
    const store = createMockStore({
      cart: { cartIsVisible: false, items: [], changed: false },
      ui: { notification: null }
    });
    render(
      <Provider store={store}>
        <CartDemoApp />
      </Provider>
    );
    
    // initially hidden
    expect(screen.queryByText('Your Shopping Cart')).toBeNull();

    // click to toggle visible
    const cartButton = screen.getByRole('button', { name: /My Cart/i });
    fireEvent.click(cartButton);

    const shoppingCartEl = screen.getByText('Your Shopping Cart');
    expect(shoppingCartEl).toBeDefined();
  });

  test('displays empty cart text description when cartIsVisible is true and list is empty', () => {
    const store = createMockStore({
      cart: { cartIsVisible: true, items: [], changed: false },
      ui: { notification: null }
    });
    render(
      <Provider store={store}>
        <CartDemoApp />
      </Provider>
    );
    const emptyText = screen.getByText('Your cart is empty.');
    expect(emptyText).toBeDefined();
  });
});
