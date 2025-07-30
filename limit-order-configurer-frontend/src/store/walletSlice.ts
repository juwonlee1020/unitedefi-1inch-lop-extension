import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WalletState {
  address: string | null;
  isConnected: boolean;
}

const initialState: WalletState = {
  address: null,
  isConnected: false,
};

export const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setWalletAddress: (state, action: PayloadAction<string>) => {
      state.address = action.payload;
      state.isConnected = true;
    },
    disconnectWallet: (state) => {
      state.address = null;
      state.isConnected = false;
    },
  },
});

export const { setWalletAddress, disconnectWallet } = walletSlice.actions;
export default walletSlice.reducer;
