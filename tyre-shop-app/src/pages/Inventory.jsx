import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import ExcelUpload from '../components/ExcelUpload';
import InventoryEditModal from '../components/InventoryEditModal';
import { Search, Plus, Pencil, AlertTriangle } from 'lucide-react';

export default function Inventory() {
  const { isOwner } = useAuth();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null); // null = closed, {} = new, {...} = editing

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('category', { ascending: true })
      .order('description', { ascending: true });
    if (!error) setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const categories = ['all', ...new Set(items.map((i) => i.category))];

  const filtered = items.filter((item) => {
    const matchesCategory = category === 'all' || item.category === category;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.code?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.category?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold font-display text-white">Inventory</h2>
        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingItem({})}
              className="flex items-center gap-2 border border-[#272A32] hover:border-neutral-600 text-neutral-300 text-sm font-medium rounded-lg px-3.5 py-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add item
            </button>
            <ExcelUpload onUploaded={fetchInventory} />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, description or category"
            className="w-full bg-[#15171C] border border-[#272A32] rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600 transition-colors"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-[#15171C] border border-[#272A32] rounded-lg px-3 py-2.5 text-sm text-neutral-300 outline-none focus:border-orange-600 transition-colors"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All categories' : c}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#15171C] border border-[#272A32] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 border-b border-[#272A32] bg-[#1B1E24]">
                <th className="py-2.5 px-4 font-normal">Code</th>
                <th className="py-2.5 px-4 font-normal">Category</th>
                <th className="py-2.5 px-4 font-normal">Description</th>
                <th className="py-2.5 px-4 font-normal text-right">Price</th>
                <th className="py-2.5 px-4 font-normal text-right">Stock</th>
                {isOwner && <th className="py-2.5 px-4 font-normal text-right">Edit</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-600">
                    Loading inventory…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-600">
                    No matching stock.
                  </td>
                </tr>
              )}
              {filtered.map((item) => {
                const isLow = item.stock_quantity <= item.low_stock_threshold;
                return (
                  <tr key={item.id} className="border-b border-[#1F2129] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-4 text-neutral-200 font-medium">{item.code}</td>
                    <td className="py-2.5 px-4 text-neutral-400">{item.category}</td>
                    <td className="py-2.5 px-4 text-neutral-400 max-w-xs truncate">
                      {item.description}
                    </td>
                    <td className="py-2.5 px-4 text-right text-orange-400">
                      ₹{Number(item.price).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          isLow ? 'text-red-400' : 'text-neutral-300'
                        }`}
                      >
                        {isLow && <AlertTriangle className="w-3.5 h-3.5" />}
                        {item.stock_quantity}
                      </span>
                    </td>
                    {isOwner && (
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="text-neutral-500 hover:text-orange-400 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem !== null && (
        <InventoryEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null);
            fetchInventory();
          }}
        />
      )}
    </div>
  );
}