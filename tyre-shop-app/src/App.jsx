import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ExcelUpload from './components/ExcelUpload';
import { 
  LayoutDashboard, 
  Layers, 
  PlusCircle, 
  Receipt, 
  Search,
  IndianRupee,
  Menu,
  Wrench
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory'); // 'dashboard', 'inventory', 'billing'
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState(null);

  const fetchInventory = async () => {
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .order('description', { ascending: true });
    if (data) setInventory(data);
  };

  const fetchFinancials = async () => {
    const { data } = await supabase
      .from('daily_financial_summary')
      .select('*')
      .limit(1)
      .single();
    if (data) setMetrics(data);
  };

  useEffect(() => {
    fetchInventory();
    fetchFinancials();
  }, []);

  const filteredInventory = inventory.filter(item => 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 pb-16 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white p-5 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-8">
          <Wrench className="h-6 w-6 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight">TyrePoint Admin</h1>
        </div>
        
        <nav className="space-y-1.5 flex-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard className="h-5 w-5" /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Layers className="h-5 w-5" /> Stock & Prices
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'billing' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Receipt className="h-5 w-5" /> Counter POS / Billing
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Mobile Top Header */}
        <div className="md:hidden flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-slate-800">TyrePoint</span>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-1 rounded">
            Live
          </span>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Financial Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Today's Sales</span>
                <p className="text-xl md:text-2xl font-bold text-slate-900 mt-1">₹{metrics?.gross_sales || '0.00'}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">UPI Collection</span>
                <p className="text-xl md:text-2xl font-bold text-blue-600 mt-1">₹{metrics?.upi_received || '0.00'}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Expenses</span>
                <p className="text-xl md:text-2xl font-bold text-rose-600 mt-1">₹{metrics?.total_expenses || '0.00'}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Net Profit</span>
                <p className="text-xl md:text-2xl font-bold text-emerald-600 mt-1">₹{metrics?.net_daily_profit || '0.00'}</p>
              </div>
            </div>
          </section>
        )}

        {/* Stock & Prices Tab */}
        {activeTab === 'inventory' && (
          <section>
            <ExcelUpload onUploadSuccess={fetchInventory} />

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <h3 className="font-bold text-slate-800 text-base">Current Tyre Stock</h3>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by size, pattern, or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Mobile Card View (< md screens) */}
              <div className="grid grid-cols-1 gap-2.5 md:hidden">
                {filteredInventory.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono bg-white px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                        {item.item_code}
                      </span>
                      <span className="text-sm font-bold text-emerald-700">
                        ₹{parseFloat(item.selling_price).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 mt-1.5">{item.description}</p>
                    <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                      <span>Serial: {item.serial_number || 'N/A'}</span>
                      <span className={`font-semibold px-2 py-0.5 rounded ${item.stock_quantity <= item.min_alert_threshold ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'}`}>
                        Qty: {item.stock_quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= md screens) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase text-xs">
                    <tr>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Serial</th>
                      <th className="py-3 px-4 text-center">Stock</th>
                      <th className="py-3 px-4 text-right">Selling Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">{item.item_code}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{item.description}</td>
                        <td className="py-3 px-4 text-slate-500">{item.serial_number || '—'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.stock_quantity <= item.min_alert_threshold ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>
                            {item.stock_quantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          ₹{parseFloat(item.selling_price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Counter POS / Billing Tab */}
        {activeTab === 'billing' && (
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Counter POS / New Sale</h2>
            <p className="text-sm text-slate-500">Fast customer billing modal ready to be linked to stock deduction.</p>
          </section>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 z-50">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-xs font-medium ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <LayoutDashboard className="h-5 w-5" />
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center gap-1 text-xs font-medium ${activeTab === 'inventory' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <Layers className="h-5 w-5" />
          Stock
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex flex-col items-center gap-1 text-xs font-medium ${activeTab === 'billing' ? 'text-blue-600' : 'text-slate-400'}`}
        >
          <Receipt className="h-5 w-5" />
          Bill
        </button>
      </nav>
    </div>
  );
}