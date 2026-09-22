import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

// Wraps every real page. Because routing is client-side, pressing "back"
// after logout re-renders this component instead of restoring a cached
// page -- and since `session` is null in memory after signOut(), it always
// redirects to /login rather than showing stale protected content.
export default function ProtectedRoute({ children }) {
  const { session, profile, loading } = useAuth();

  if (loading || session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0C0F]">
        <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0C0F] text-neutral-400 text-sm px-4 text-center">
        Couldn't load your account profile. Contact the shop owner.
      </div>
    );
  }

  return children;
}