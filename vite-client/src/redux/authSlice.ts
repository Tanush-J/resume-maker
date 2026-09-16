import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "./store";

const initialState = {
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authenticate(state, actions) {
      state.isAuthenticated = actions.payload;
    }
  },
});

export const { authenticate } = authSlice.actions;
export default authSlice.reducer;

export const authSelector = (state: RootState) => state.auth;