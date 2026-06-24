const BB_GRAY_DARK = "#332a1e";

interface ToggleLegendProps {
  items: { key: string; label: string; color: string }[];
  hidden: Set<string>;
  onToggle: (key: string) => void;
}

const ToggleLegend = ({ items, hidden, onToggle }: ToggleLegendProps) => (
  <div className="flex flex-wrap items-center gap-3 mt-1" style={{ fontSize: 9 }}>
    {items.map(item => {
      const off = hidden.has(item.key);
      return (
        <span
          key={item.key}
          onClick={(e) => { e.stopPropagation(); onToggle(item.key); }}
          style={{
            color: off ? BB_GRAY_DARK : item.color,
            cursor: "pointer",
            textDecoration: off ? "line-through" : "none",
            opacity: off ? 0.4 : 1,
            userSelect: "none",
            transition: "opacity 0.15s, color 0.15s",
          }}
        >■ {item.label}</span>
      );
    })}
  </div>
);

export default ToggleLegend;
