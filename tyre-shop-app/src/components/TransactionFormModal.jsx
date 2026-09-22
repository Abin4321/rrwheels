import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { X, Loader2, Banknote, Smartphone, CreditCard, MoreHorizontal } from 'lucide-react';

const PAYMENT_MODES = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'upi', label: 'UPI', icon: Smartphone },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

export default function TransactionFormModal({ onClose, onSaved }) {
  const { profile } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { error: saveError } = await supabase.from('transactions').insert({
      amount: parseFloat(amount),
      payment_mode: paymentMode,
      transaction_date: date,
      notes: notes.trim() || null,
      created_by: profile?.id,
    });

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSave}
        className="bg-[#15171C] border border-[#272A32] rounded-2xl w-full max-w-sm card-enter"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#272A32]">
          <h3 className="text-sm font-semibold text-white">Log a sale</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <label className="block">
            <span className="block text-xs text-neutral-400 mb-1">Amount (₹)</span>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input text-lg font-semibold"
              placeholder="0.00"
            />
          </label>

          <div>
            <span className="block text-xs text-neutral-400 mb-2">Payment mode</span>
            <div className="grid grid-cols-4 gap-2">
              {PAYMENT_MODES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaymentMode(value)}
                  className={`flex flex-col items-center gap-1 rounded-lg border py-2.5 text-xs transition-all ${
                    paymentMode === value
                      ? 'border-orange-600 bg-orange-600/10 text-orange-400'
                      : 'border-[#272A32] text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="block text-xs text-neutral-400 mb-1">Date</span>
            <input
              required
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </label>

          <label className="block">
            <span className="block text-xs text-neutral-400 mb-1">Notes (optional)</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              placeholder="e.g. 2 tyres + alignment"
            />
          </label>
        </div>

        <div className="flex justify-end px-5 py-4 border-t border-[#272A32]">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save transaction
          </button>
        </div>
      </form>
    </div>
  );
}