import { createSlice } from '@reduxjs/toolkit';
import { sendCartData, fetchCartData } from './cart-actions';

const initialUiState = {
  notification: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUiState,
  reducers: {
    showNotification(state, action) {
      state.notification = action.payload ? {
        status: action.payload.status,
        title: action.payload.title,
        message: action.payload.message,
      } : null;
    },
  },
  extraReducers: (builder) => {
    builder
      // sendCartData notification cases
      .addCase(sendCartData.pending, (state) => {
        state.notification = {
          status: 'pending',
          title: 'Sending...',
          message: 'Sending cart data!',
        };
      })
      .addCase(sendCartData.fulfilled, (state) => {
        state.notification = {
          status: 'success',
          title: 'Success!',
          message: 'Sent cart data successfully!',
        };
      })
      .addCase(sendCartData.rejected, (state) => {
        state.notification = {
          status: 'error',
          title: 'Error!',
          message: 'Sending cart data failed!',
        };
      })
      // fetchCartData notification cases
      .addCase(fetchCartData.pending, (state) => {
        state.notification = {
          status: 'pending',
          title: 'Fetching...',
          message: 'Fetching cart data!',
        };
      })
      .addCase(fetchCartData.fulfilled, (state) => {
        state.notification = {
          status: 'success',
          title: 'Success!',
          message: 'Fetched cart data successfully!',
        };
      })
      .addCase(fetchCartData.rejected, (state) => {
        state.notification = {
          status: 'error',
          title: 'Error!',
          message: 'Fetching cart data failed!',
        };
      });
  },
});

export const uiActions = uiSlice.actions;
export default uiSlice.reducer;
