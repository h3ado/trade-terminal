// Generic clickable terminal row — cursor + hover highlight + accent symbol on hover.
// Use as a drop-in wrapper for any data row that navigates on click.
interface Props {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export function DrillRow({ onClick, children, className = '' }: Props) {
  return (
    <div
      className={`flex items-center px-2 py-[3px] border-b border-border cursor-pointer hover:bg-white/[0.04] group transition-colors ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
