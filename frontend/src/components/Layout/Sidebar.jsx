import { LayoutDashboard, Users, Settings as SettingsIcon } from "lucide-react";
import logo from "../../assets/logo.jpg";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "members", label: "Members", icon: Users },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <>
      {/* Desktop side rail */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-gym-border md:bg-gym-panel">
        <div className="flex items-center gap-3 border-b border-gym-border px-5 py-5">
          <img src={logo} alt="B-FITNESS" className="h-11 w-11 rounded-md object-cover" />
          <div>
            <p className="font-display text-2xl leading-none tracking-wide text-gym-text">B-FITNESS</p>
            <p className="text-[11px] uppercase tracking-widest text-gym-muted">Membership Manager</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active === id
                  ? "bg-gym-gold/10 text-gym-gold border-l-2 border-gym-gold"
                  : "text-gym-muted hover:bg-gym-panel2 hover:text-gym-text border-l-2 border-transparent"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="border-t border-gym-border px-5 py-4 text-[11px] text-gym-muted">
          Track members. Beat the clock. Keep them lifting.
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center gap-3 border-b border-gym-border bg-gym-panel px-4 py-3 md:hidden">
        <img src={logo} alt="B-FITNESS" className="h-8 w-8 rounded object-cover" />
        <p className="font-display text-xl tracking-wide text-gym-text">B-FITNESS</p>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gym-border bg-gym-panel md:hidden">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
              active === id ? "text-gym-gold" : "text-gym-muted"
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
