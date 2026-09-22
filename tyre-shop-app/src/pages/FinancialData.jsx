import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import TransactionFormModal from '../components/TransactionFormModal';
import { Plus, Banknote, Smartphone, CreditCard, MoreHorizontal, Wallet } from 'lucide-react';

const MODE_META = {
  cash: { label: 'Cash', icon: Banknote },
  upi: { label: 'UPI', icon: Smartphone },
  card: { label: 'Card', icon: CreditCard },
  other: { label: 'Other', icon: MoreHorizontal },
};

export default function FinancialData() {
  const { isOwner } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error) setTransactions(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const totals = transactions.reduce(
    (acc, t) => {
      acc.total += Number(t.amount);
      acc.byMode[t.payment_mode] = (acc.byMode[t.payment_mode] ?? 0) + Number(t.amount);
      return acc;
    },
    { total: 0, byMode: {} }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold font-display text-white">Financial Data</h2>
        {isOwner && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg px-3.5 py-2 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Log a sale
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card-enter bg-orange-600/10 border border-orange-700/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-orange-300/80">Total revenue</span>
          </div>
          <p className="text-xl font-semibold font-display text-orange-400">
            ₹{totals.total.toLocaleString('en-IN')}
          </p>
        </div>
        {Object.entries(MODE_META).map(([mode, { label, icon: Icon }]) => (
          <div key={mode} className="card-enter bg-[#15171C] border border-[#272A32] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-neutral-400" />
              <span className="text-xs text-neutral-500">{label}</span>
            </div>
            <p className="text-xl font-semibold font-display text-white">
              ₹{(totals.byMode[mode] ?? 0).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#15171C] border border-[#272A32] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 border-b border-[#272A32] bg-[#1B1E24]">
                <th className="py-2.5 px-4 font-normal">Date</th>
                <th className="py-2.5 px-4 font-normal">Payment mode</th>
                <th className="py-2.5 px-4 font-normal">Notes</th>
                <th className="py-2.5 px-4 font-normal text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-600">
                    Loading transactions…
                  </td>
                </tr>
              )}
              {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-neutral-600">
                    No transactions logged yet.
                  </td>
                </tr>
              )}
              {transactions.map((t) => {
                const meta = MODE_META[t.payment_mode] ?? MODE_META.other;
                const Icon = meta.icon;
                return (
                  <tr key={t.id} className="border-b border-[#1F2129] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-4 text-neutral-300">
                      {new Date(t.transaction_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-neutral-400">
                        <Icon className="w-3.5 h-3.5" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-neutral-500 max-w-xs truncate">
                      {t.notes || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right text-orange-400 font-medium">
                      ₹{Number(t.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <TransactionFormModal
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchTransactions();
          }}
        />
      )}
    </div>
  );
}