import AccountBar from '@/components/AccountBar';

export default function ViewHeader({ title }: { title?: string }) {
  return (
    <div className="flex items-center gap-2">
      {title && <h1 className="text-sm font-mono font-bold text-foreground uppercase tracking-wider">{title}</h1>}
      <AccountBar />
    </div>
  );
}
