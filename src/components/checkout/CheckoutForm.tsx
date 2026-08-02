import { useState } from 'react';
import { useCheckoutStore } from '../../lib/checkout-store';
import api from '../../lib/api-client';
import SchemaOrgOrder from './SchemaOrgOrder';

export default function CheckoutForm() {
  const store = useCheckoutStore();
  const [showReceipt, setShowReceipt] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (store.isLocked || store.isProcessing) return;
    store.lock();

    try {
      const idempotencyKey = `${store.productQuantaHash}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const { data: result } = await api.post('/checkout', {
        productQuantaHash: store.productQuantaHash,
        idempotencyKey,
        amount: store.amount,
        currency: store.currency,
        tax: store.tax,
        fee: store.fee,
        paymentMethod: store.paymentMethod,
        customerEmail: store.customerEmail,
        customerName: store.customerName,
      });

      if (result.success) {
        store.setSuccess(result.txHash);
        setTimeout(() => setShowReceipt(true), 100);
      } else {
        store.setError(result.error || 'Transaction failed');
      }
    } catch (err: any) {
      store.setError(err.error || err.message || 'Network error');
    }
  };

  if (showReceipt && store.txHash) {
    return (
      <>
        <SchemaOrgOrder
          txHash={store.txHash}
          productQuantaHash={store.productQuantaHash}
          total={store.amount}
          currency={store.currency}
          status="COMPLETED"
        />
        <div className="card-sovereign max-w-lg mx-auto receipt-slide">
          <div className="text-center">
            <div className="splash-check mx-auto mb-4 w-20 h-20 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-sovereign-navy mb-2">Payment Confirmed</h2>
            <p className="text-sovereign-slate mb-6">Your transaction has been processed successfully.</p>

            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-xs text-sovereign-slate mb-1">Transaction Hash</p>
              <p className="text-sm font-semibold text-sovereign-navy break-all">{store.txHash}</p>
            </div>

            <div className="flex justify-between text-sm text-sovereign-slate mb-2">
              <span>Product</span>
              <span className="font-medium text-sovereign-navy">{store.productQuantaHash}</span>
            </div>
            <div className="flex justify-between text-sm text-sovereign-slate mb-2">
              <span>Total</span>
              <span className="font-bold text-sovereign-orange text-lg">${store.amount.toFixed(2)}</span>
            </div>

            <button
              onClick={() => { store.reset(); setShowReceipt(false); }}
              className="btn-sovereign w-full mt-6"
            >
              New Transaction
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card-sovereign max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-sovereign-navy mb-6 text-center">MotherCheckoutQuanta</h2>

      {store.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
          {store.error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-sovereign-navy mb-1">Product Quanta Hash</label>
          <input
            type="text"
            className="input-sovereign"
            placeholder="Enter product hash"
            value={store.productQuantaHash}
            onChange={(e) => store.setField('productQuantaHash', e.target.value)}
            disabled={store.isLocked}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-sovereign-navy mb-1">Amount (USD)</label>
            <input
              type="number"
              step="0.01"
              className="input-sovereign"
              placeholder="0.00"
              value={store.amount || ''}
              onChange={(e) => store.setField('amount', parseFloat(e.target.value) || 0)}
              disabled={store.isLocked}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sovereign-navy mb-1">Payment Method</label>
            <select
              className="input-sovereign"
              value={store.paymentMethod}
              onChange={(e) => store.setField('paymentMethod', e.target.value)}
              disabled={store.isLocked}
            >
              <option value="">Select method</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-sovereign-navy mb-1">Tax</label>
            <input
              type="number"
              step="0.01"
              className="input-sovereign"
              placeholder="0.00"
              value={store.tax || ''}
              onChange={(e) => store.setField('tax', parseFloat(e.target.value) || 0)}
              disabled={store.isLocked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sovereign-navy mb-1">Fee</label>
            <input
              type="number"
              step="0.01"
              className="input-sovereign"
              placeholder="0.00"
              value={store.fee || ''}
              onChange={(e) => store.setField('fee', parseFloat(e.target.value) || 0)}
              disabled={store.isLocked}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-sovereign-navy mb-1">Customer Name</label>
          <input
            type="text"
            className="input-sovereign"
            placeholder="Optional"
            value={store.customerName}
            onChange={(e) => store.setField('customerName', e.target.value)}
            disabled={store.isLocked}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-sovereign-navy mb-1">Customer Email</label>
          <input
            type="email"
            className="input-sovereign"
            placeholder="Optional"
            value={store.customerEmail}
            onChange={(e) => store.setField('customerEmail', e.target.value)}
            disabled={store.isLocked}
          />
        </div>

        <button
          type="submit"
          className="btn-sovereign w-full text-base py-4"
          disabled={store.isLocked || store.isProcessing}
        >
          {store.isProcessing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Processing...
            </span>
          ) : (
            'Pay Now / Confirm Purchase'
          )}
        </button>
      </div>
    </form>
  );
}
