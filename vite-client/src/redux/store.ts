import { configureStore } from "@reduxjs/toolkit";

import authReducer from './authSlice'
import loadingReducer from './loadingSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    loading: loadingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>

export default store;

// Expose the store to window for debugging in development mode
if (import.meta.env.DEV) {
  window.store = store;
}