/// <reference types="vite/client" />

import type { store } from './redux/store';

declare global {
  interface Window {
    store: typeof store;
  }
}