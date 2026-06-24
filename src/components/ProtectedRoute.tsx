import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
