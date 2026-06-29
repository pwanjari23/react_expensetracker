import { createSlice } from '@reduxjs/toolkit';

const initialThemeState = {
  isPremium: false,
  isDark: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState: initialThemeState,
  reducers: {
    activatePremium(state) {
      state.isPremium = true;
    },
    toggleTheme(state) {
      state.isDark = !state.isDark;
    },
  },
});

export const themeActions = themeSlice.actions;
export default themeSlice.reducer;
