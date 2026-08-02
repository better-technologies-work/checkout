import { create } from 'zustand';

interface CheckoutState {
  productQuantaHash: string;
  amount: number;
  currency: string;
  tax: number;
  fee: number;
  paymentMethod: string;
  customerEmail: string;
  customerName: string;

  isProcessing: boolean;
  isLocked: boolean;
  txHash: string | null;
  error: string | null;

  setField: (field: string, value: string | number) => void;
  lock: () => void;
  setProcessing: (v: boolean) => void;
  setSuccess: (txHash: string) => void;
  setError: (err: string) => void;
  reset: () => void;
}

const initialState = {
  productQuantaHash: '',
  amount: 0,
  currency: 'USD',
  tax: 0,
  fee: 0,
  paymentMethod: '',
  customerEmail: '',
  customerName: '',
  isProcessing: false,
  isLocked: false,
  txHash: null,
  error: null,
};

export const useCheckoutStore = create<CheckoutState>((set) => ({
  ...initialState,

  setField: (field, value) => set({ [field]: value }),
  lock: () => set({ isLocked: true, isProcessing: true }),
  setProcessing: (v) => set({ isProcessing: v }),
  setSuccess: (txHash) => set({ txHash, isProcessing: false, error: null }),
  setError: (err) => set({ error: err, isProcessing: false }),
  reset: () => set(initialState),
}));
