import { configureStore } from '@reduxjs/toolkit';
import walletReducer from './walletSlice';
import strategiesReducer from './strategiesSlice'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'



export const store = configureStore({
  reducer: {
    wallet: walletReducer,
    strategies: strategiesReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector


