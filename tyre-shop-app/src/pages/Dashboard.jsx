import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { Boxes, TrendingUp, AlertTriangle, IndianRupee } from 'lucide-react';

export default function Dashboard() {
  const [categoryData, setCategoryData] = useState([]);
  const [trend, setTrend] = useState([]);
  const [stats, setStats] = useState({
    totalStockValue: 0,
    totalItems: 0,
    lowStockCount: 0,
    todayRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const [{ data: byCategory }, { data: dailySummaries }, { data: inventory }] =
        await Promise.all([
          supabase.from('inventory_by_category').select('*'),
          supabase
            .from('daily_financial_summary')
            .select('*')
            .order('transaction_date', { ascending: true })
            .limit(14),
          supabase.from('inventory').select('stock_quantity, price, stock_quantity, low_stock_threshold'),
        ]);

      if (!isMounted) return;

      setCategoryData(
        (byCategory ?? []).map((c) => ({
          category: c.category,
          items: c.item_count ?? 0,
          stock: c.total_stock ?? 0,
          value: Number(c.stock_value ?? 0),
        }))
      );

      setTrend(
        (dailySummaries ?? []).map((d) => ({
          date: new Date(d.transaction_date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
          }),
          revenue: Number(d.total_revenue ?? 0),
        }))
      );

      const totalStockValue = (inventory ?? []).reduce(
        (sum, i) => sum + i.stock_quantity * Number(i.price ?? 0),
        0
      );
      const lowStockCount = (inventory ?? []).filter(
        (i) => i.stock_quantity <= i.low_stock_threshold
      ).length;
      const today = new Date().toISOString().slice(0, 10);
      const todaySummary = (dailySummaries ?? []).find(
        (d) => d.transaction_date === today
      );

      setStats({
        totalStockValue,
        totalItems: (inventory ?? []).length,
        lowStockCount,
        todayRevenue: Number(todaySummary?.total_revenue ?? 0),
      });

      setLoading(false);
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <div className="text-neutral-500 text-sm">Loading dashboard…</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold font-display text-white">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={IndianRupee}
          label="Today's revenue"
          value={`₹${stats.todayRevenue.toLocaleString('en-IN')}`}
        />
        <StatCard
          icon={Boxes}
          label="Stock value"
          value={`₹${stats.totalStockValue.toLocaleString('en-IN')}`}
        />
        <StatCard icon={TrendingUp} label="Items tracked" value={stats.totalItems} />
        <StatCard
          icon={AlertTriangle}
          label="Low stock alerts"
          value={stats.lowStockCount}
          alert={stats.lowStockCount > 0}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Revenue, last 14 days">
          {trend.length === 0 ? (
            <EmptyChart text="No transactions logged yet." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend}>
                <CartesianGrid stroke="#272A32" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke="#8B8F99" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8B8F99" fontSize={11} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  contentStyle={{
                    background: '#1B1E24',
                    border: '1px solid #272A32',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#8B8F99' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#F97316"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#F97316' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Stock quantity by category">
          {categoryData.length === 0 ? (
            <EmptyChart text="No inventory uploaded yet." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData}>
                <CartesianGrid stroke="#272A32" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="category" stroke="#8B8F99" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#8B8F99" fontSize={11} tickLine={false} axisLine={false} width={32} />
                <Tooltip
                  contentStyle={{
                    background: '#1B1E24',
                    border: '1px solid #272A32',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: '#8B8F99' }}
                />
                <Bar dataKey="stock" fill="#F97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Stock by category">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-500 border-b border-[#272A32]">
                <th className="py-2 pr-4 font-normal">Category</th>
                <th className="py-2 pr-4 font-normal text-right">Items</th>
                <th className="py-2 pr-4 font-normal text-right">Stock qty</th>
                <th className="py-2 font-normal text-right">Stock value</th>
              </tr>
            </thead>
            <tbody>
              {categoryData.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-neutral-600">
                    No data yet.
                  </td>
                </tr>
              )}
              {categoryData.map((c) => (
                <tr key={c.category} className="border-b border-[#1F2129] last:border-0">
                  <td className="py-2.5 pr-4 text-neutral-200">{c.category}</td>
                  <td className="py-2.5 pr-4 text-right text-neutral-400">{c.items}</td>
                  <td className="py-2.5 pr-4 text-right text-neutral-400">{c.stock}</td>
                  <td className="py-2.5 text-right text-orange-400">
                    ₹{c.value.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, alert }) {
  return (
    <div
      className={`card-enter rounded-xl border p-4 ${
        alert
          ? 'bg-red-950/20 border-red-900/40'
          : 'bg-[#15171C] border-[#272A32]'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${alert ? 'text-red-400' : 'text-orange-500'}`} />
        <span className="text-xs text-neutral-500">{label}</span>
      </div>
      <p className={`text-xl font-semibold font-display ${alert ? 'text-red-300' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="card-enter bg-[#15171C] border border-[#272A32] rounded-xl p-4">
      <h3 className="text-sm font-medium text-neutral-300 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ text }) {
  return (
    <div className="h-[240px] flex items-center justify-center text-sm text-neutral-600">
      {text}
    </div>
  );
}