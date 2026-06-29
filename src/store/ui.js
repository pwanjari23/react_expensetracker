import { createSlice } from '@reduxjs/toolkit';

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
});

export const uiActions = uiSlice.actions;
export default uiSlice.reducer;
