import { configureStore } from '@reduxjs/toolkit';
import logReducer from './logSlice';

const store = configureStore({
  reducer: {
    logs: logReducer,
  },
});

export default store;