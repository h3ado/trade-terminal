import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function Auth() {
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        await register(email, password, displayName || email.split('@')[0]);
        toast.success('Account created');
      } else {
        await login(email, password);
        toast.success('Signed in');
      }
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-sm bg-surface-elevated border border-border p-6 space-y-4">
        <div className="border-b border-accent/30 pb-3">
          <div className="text-[10px] text-accent uppercase tracking-widest">@h3ado // Terminal</div>
          <h1 className="text-lg font-bold text-foreground mt-1">{mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}</h1>
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="text-[10px] text-muted-foreground uppercase">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-surface-deep border border-border px-2 py-1.5 text-xs focus:border-accent focus:outline-none"
                placeholder="Your name"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-surface-deep border border-border px-2 py-1.5 text-xs focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface-deep border border-border px-2 py-1.5 text-xs focus:border-accent focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-accent text-accent-foreground font-bold text-xs py-2 hover:bg-accent/90 disabled:opacity-50"
          >
            {busy ? '...' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="w-full text-[10px] text-muted-foreground hover:text-accent"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
