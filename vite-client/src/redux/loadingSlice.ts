import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "./store";

export interface LoadingContextType {
  loading: boolean
}

const initialState: LoadingContextType = {
  loading: false,
};

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
   setLoading(state, actions) {
    state.loading = actions.payload;
   }
  },
});

export const { setLoading } = loadingSlice.actions;
export default loadingSlice.reducer;

export const loadingSelector = (state: RootState) => state.loading;