import { createAsyncThunk } from '@reduxjs/toolkit';
import { cartActions } from './cart';

// Async Thunk for sending cart data to Firebase
export const sendCartData = createAsyncThunk(
  'cart/sendCartData',
  async (cart, { rejectWithValue }) => {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const response = await fetch(
      `https://${projectId}-default-rtdb.firebaseio.com/cart.json`,
      {
        method: 'PUT',
        body: JSON.stringify({
          items: cart.items || [],
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Sending cart data failed.');
    }
  }
);

// Async Thunk for fetching cart data from Firebase
export const fetchCartData = createAsyncThunk(
  'cart/fetchCartData',
  async (_, { dispatch, rejectWithValue }) => {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const response = await fetch(
      `https://${projectId}-default-rtdb.firebaseio.com/cart.json`
    );

    if (!response.ok) {
      throw new Error('Could not fetch cart data!');
    }

    const data = await response.json();
    dispatch(
      cartActions.replaceCart({
        items: data ? data.items || [] : [],
      })
    );
    return data;
  }
);
