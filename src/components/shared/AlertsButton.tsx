import { useState } from "react";
import { Bell } from "lucide-react";
import AlertsDrawer from "@/components/options/alerts/AlertsDrawer";

export default function AlertsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider border border-border text-muted-foreground hover:border-accent hover:text-accent flex items-center gap-1"
        title="Alerts"
      >
        <Bell size={9} /> ALRT
      </button>
      <AlertsDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
