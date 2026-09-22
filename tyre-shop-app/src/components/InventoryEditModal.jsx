import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { X, Loader2, Trash2 } from 'lucide-react';

export default function InventoryEditModal({ item, onClose, onSaved }) {
  const isNew = !item?.id;
  const [form, setForm] = useState({
    code: item?.code ?? '',
    category: item?.category ?? '',
    description: item?.description ?? '',
    price: item?.price ?? '',
    stock_quantity: item?.stock_quantity ?? 0,
    low_stock_threshold: item?.low_stock_threshold ?? 5,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      code: form.code.trim(),
      category: form.category.trim() || 'Uncategorized',
      description: form.description.trim(),
      price: parseFloat(form.price) || 0,
      stock_quantity: parseInt(form.stock_quantity, 10) || 0,
      low_stock_threshold: parseInt(form.low_stock_threshold, 10) || 0,
    };

    const { error: saveError } = isNew
      ? await supabase.from('inventory').insert(payload)
      : await supabase.from('inventory').update(payload).eq('id', item.id);

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    onSaved();
  };

  const handleDelete = async () => {
    if (!confirm(`Remove ${item.code} from inventory?`)) return;
    setDeleting(true);
    const { error: deleteError } = await supabase.from('inventory').delete().eq('id', item.id);
    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-70 z-50">
      <form
        onSubmit={handleSave}
        className="bg-[#15171C] border border-[#272A32] rounded-2xl w-full max-w-md card-enter"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#272A32]">
          <h3 className="text-sm font-semibold text-white">
            {isNew ? 'Add stock item' : `Edit ${item.code}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {error && (
            <div className="bg-red-950/40 border border-red-900/60 text-red-300 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Field label="Code">
            <input
              required
              value={form.code}
              onChange={update('code')}
              className="input"
            />
          </Field>

          <Field label="Category">
            <input value={form.category} onChange={update('category')} className="input" />
          </Field>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={update('description')}
              rows={2}
              className="input resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={update('price')}
                className="input"
              />
            </Field>
            <Field label="Stock qty">
              <input
                type="number"
                min="0"
                value={form.stock_quantity}
                onChange={update('stock_quantity')}
                className="input"
              />
            </Field>
          </div>

          <Field label="Low-stock alert below">
            <input
              type="number"
              min="0"
              value={form.low_stock_threshold}
              onChange={update('low_stock_threshold')}
              className="input"
            />
          </Field>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-[#272A32]">
          {!isNew ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? 'Removing…' : 'Delete'}
            </button>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isNew ? 'Add item' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs text-neutral-400 mb-1">{label}</span>
      {children}
    </label>
  );
}