import { useEffect, useRef, useState } from 'react';
import { LogOut, User as UserIcon, Mail, Calendar, Shield, Pencil, Check, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPatch } from '@/lib/api';
import { toast } from 'sonner';

export default function AccountMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [draftName, setDraftName] = useState('');
  const [draftAvatar, setDraftAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    apiGet('/api/profiles/me')
      .then((data: any) => {
        setDisplayName(data?.displayName || '');
        setAvatarUrl(data?.avatarUrl || '');
      })
      .catch(() => {
        // fallback to user object values
        setDisplayName(user.displayName || '');
        setAvatarUrl(user.avatarUrl || '');
      });
  }, [user]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  if (!user) return null;

  const handle = displayName ? `@${displayName.toLowerCase().replace(/\s+/g, '')}` : `@${(user.email || 'user').split('@')[0]}`;
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '—';
  const initial = (displayName || user.email || '?').charAt(0).toUpperCase();

  const startEdit = () => {
    setDraftName(displayName);
    setDraftAvatar(avatarUrl);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    const name = draftName.trim();
    if (!name) {
      toast.error('Display name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await apiPatch('/api/profiles/me', { displayName: name, avatarUrl: draftAvatar.trim() || null });
      setDisplayName(name);
      setAvatarUrl(draftAvatar.trim());
      setEditing(false);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-accent-foreground tracking-wider hover:bg-accent-foreground/10 px-1.5 py-0.5 transition-colors"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
        ) : (
          <span className="w-4 h-4 flex items-center justify-center bg-accent-foreground text-accent text-[9px] font-bold rounded-full">
            {initial}
          </span>
        )}
        {handle}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-0.5 w-80 bg-card border border-accent/30 shadow-lg z-50 font-mono">
          <div className="px-3 py-2 bg-surface-elevated border-b border-accent/20 flex items-center gap-2">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 flex items-center justify-center bg-accent text-accent-foreground text-sm font-bold rounded-full">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-foreground truncate">{displayName || 'No name set'}</div>
              <div className="text-[9px] text-accent uppercase tracking-widest">{handle}</div>
            </div>
            {!editing && (
              <button
                onClick={startEdit}
                title="Edit profile"
                className="p-1 text-muted-foreground hover:text-accent transition-colors"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>

          {editing ? (
            <div className="px-3 py-2 space-y-2">
              <div>
                <label className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <UserIcon className="w-3 h-3" /> Display Name
                </label>
                <input
                  value={draftName}
                  onChange={e => setDraftName(e.target.value)}
                  maxLength={50}
                  autoFocus
                  className="w-full bg-surface-deep border border-border px-2 py-1 text-[11px] focus:border-accent focus:outline-none mt-0.5"
                />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Avatar URL <span className="text-muted-foreground/60 normal-case">(optional)</span>
                </label>
                <input
                  value={draftAvatar}
                  onChange={e => setDraftAvatar(e.target.value)}
                  placeholder="https://…"
                  className="w-full bg-surface-deep border border-border px-2 py-1 text-[10px] focus:border-accent focus:outline-none mt-0.5"
                />
              </div>
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1 bg-accent text-accent-foreground text-[10px] font-bold py-1.5 hover:bg-accent/90 disabled:opacity-50"
                >
                  <Check className="w-3 h-3" /> {saving ? 'SAVING' : 'SAVE'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="flex items-center justify-center gap-1 bg-surface-deep border border-border text-foreground text-[10px] font-bold py-1.5 px-3 hover:border-accent"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="px-3 py-2 space-y-1.5 text-[10px]">
              <Row icon={<Mail className="w-3 h-3" />} label="EMAIL" value={user.email || '—'} />
              <Row icon={<UserIcon className="w-3 h-3" />} label="USER ID" value={user.id.slice(0, 8) + '…'} mono />
              <Row icon={<Shield className="w-3 h-3" />} label="PROVIDER" value="EMAIL" />
              <Row icon={<Calendar className="w-3 h-3" />} label="JOINED" value={joined} />
            </div>
          )}

          <div className="border-t border-border">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-negative hover:bg-negative/10 transition-colors"
            >
              <LogOut className="w-3 h-3" /> SIGN OUT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="uppercase tracking-wider text-[9px]">{label}</span>
      </div>
      <span className={`text-foreground truncate max-w-[180px] text-right ${mono ? 'tabular-nums' : ''}`} title={value}>{value}</span>
    </div>
  );
}
