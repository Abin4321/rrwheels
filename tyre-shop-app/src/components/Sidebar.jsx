import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Boxes,
  Wallet,
  LogOut,
  CircleGauge,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/financial', label: 'Financial Data', icon: Wallet },
];

export default function Sidebar() {
  const { profile, isOwner, signOut } = useAuth();

  return (
    <>
      {/* ── Desktop sidebar only ─────────────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:w-60 shrink-0 border-r border-[#1F2129] bg-[#101115] p-4">
        <div className="flex items-center gap-2.5 mb-8 px-1">
          <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/20">
            <CircleGauge className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm font-semibold font-display leading-tight text-white">
            RR Wheels Truing
          </p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? 'bg-orange-600/15 text-orange-400'
                    : 'text-neutral-400 hover:bg-white/[0.04] hover:text-white'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#1F2129] pt-3 px-1">
          <p className="text-xs text-neutral-400 truncate">{profile?.email}</p>
          <span
            className={`inline-block mt-1.5 mb-3 text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-full ${
              isOwner
                ? 'bg-orange-600/15 text-orange-400'
                : 'bg-neutral-700/40 text-neutral-400'
            }`}
          >
            {isOwner ? 'Owner' : 'Admin'}
          </span>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 text-sm text-neutral-400 hover:text-red-400 transition-colors py-1.5"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar (logo + name + role) ──────────────────── */}
      <header className="md:hidden flex items-center justify-between border-b border-[#1F2129] bg-[#101115] px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shrink-0">
            <CircleGauge className="w-4.5 h-4.5 text-white" />
          </div>
          <p className="text-sm font-semibold font-display text-white truncate">
            RR Wheels Truing
          </p>
        </div>

        <span
          className={`shrink-0 text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-full ${
            isOwner
              ? 'bg-orange-600/15 text-orange-400'
              : 'bg-neutral-700/40 text-neutral-400'
          }`}
        >
          {isOwner ? 'Owner' : 'Admin'}
        </span>
      </header>

      {/* ── Mobile bottom nav + logout ───────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#101115] border-t border-[#1F2129] flex z-20">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors ${
                isActive ? 'text-orange-400' : 'text-neutral-500'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="leading-none">{label}</span>
          </NavLink>
        ))}

        <button
          onClick={signOut}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] text-neutral-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="leading-none">Log out</span>
        </button>
      </nav>
    </>
  );
}