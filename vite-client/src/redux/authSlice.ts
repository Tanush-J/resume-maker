import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";
import type { User } from 'firebase/auth';

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setAuthInitialized(state, action: PayloadAction<boolean>) {
      state.isInitialized = action.payload;
    }
  },
});

export const { setUser, setAuthInitialized } = authSlice.actions;
export default authSlice.reducer;

export const authSelector = (state: RootState) => state.auth;