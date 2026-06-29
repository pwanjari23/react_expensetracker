import { createSlice } from '@reduxjs/toolkit';

const initialAuthState = {
  token: localStorage.getItem('idToken') || null,
  userId: localStorage.getItem('userId') || null,
  isAuthenticated: !!localStorage.getItem('idToken'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    login(state, action) {
      state.token = action.payload.token;
      state.userId = action.payload.userId;
      state.isAuthenticated = true;
      localStorage.setItem('idToken', action.payload.token);
      localStorage.setItem('userId', action.payload.userId);
    },
    logout(state) {
      state.token = null;
      state.userId = null;
      state.isAuthenticated = false;
      localStorage.removeItem('idToken');
      localStorage.removeItem('userId');
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice.reducer;
