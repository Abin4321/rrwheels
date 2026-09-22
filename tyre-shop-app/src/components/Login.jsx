import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, AlertCircle, CircleGauge } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(
        signInError.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : signInError.message
      );
      setLoading(false);
      return;
    }
    // AuthProvider's onAuthStateChange listener picks up the new session
    // and ProtectedRoute redirects automatically -- no manual nav here.
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0C0F] px-4 relative overflow-hidden">
      {/* faint background accent */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-orange-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-orange-600/5 blur-3xl" />

      <div className="w-full max-w-sm relative page-enter">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-600 mb-4 shadow-lg shadow-orange-600/20">
            <CircleGauge className="w-7 h-7 text-white" strokeWidth={2.25} />
          </div>
          <h1 className="text-2xl font-semibold font-display text-white">RR Wheels Truing</h1>
          <p className="text-neutral-500 text-sm mt-1">Shop dashboard sign in</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-[#15171C] border border-[#272A32] rounded-2xl p-6 space-y-4 shadow-xl shadow-black/20"
        >
          {error && (
            <div className="flex items-start gap-2 bg-red-950/40 border border-red-900/60 text-red-300 text-sm rounded-lg px-3 py-2 card-enter">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm text-neutral-400 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg bg-[#1B1E24] border border-[#272A32] text-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
              placeholder="owner@rrwheels.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-neutral-400 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg bg-[#1B1E24] border border-[#272A32] text-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-orange-600 focus:ring-1 focus:ring-orange-600"
              placeholder="********"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:bg-orange-900 disabled:cursor-not-allowed text-white font-medium py-2.5 text-sm transition-all active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-neutral-600 mt-6">
          Owner and admin accounts are provisioned by the shop owner.
        </p>
      </div>
    </div>
  );
}