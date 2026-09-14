import { Calendar } from "lucide-react";
import WhatsAppButton from "../shared/WhatsAppButton";
import { formatShortDate } from "../../utils/dateUtils";

export default function ExpiringSoonList({ members, onSelectMember }) {
  if (!members.length) {
    return (
      <div className="rounded-lg border border-gym-border bg-gym-panel p-8 text-center text-sm text-gym-muted">
        No memberships are expiring soon. Nothing needs your attention right now.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gym-border rounded-lg border border-gym-border bg-gym-panel">
      {members.map((m) => (
        <div key={m._id} className="flex flex-wrap items-center gap-4 px-4 py-3 sm:flex-nowrap">
          <button
            onClick={() => onSelectMember(m._id)}
            className="flex flex-1 items-center gap-3 text-left min-w-[200px]"
          >
            {m.photo ? (
              <img src={m.photo} alt={m.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gym-panel2 font-display text-lg text-gym-muted">
                {m.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-medium text-gym-text">{m.name}</p>
              <p className="flex items-center gap-1 text-xs text-gym-muted">
                <Calendar size={12} /> Expires {formatShortDate(m.expiryDate)}
              </p>
            </div>
          </button>
          <span
            className={`text-xs font-medium ${
              m.daysRemaining < 0 ? "text-status-expired" : "text-status-expiring"
            }`}
          >
            {m.daysRemaining < 0
              ? `${Math.abs(m.daysRemaining)}d overdue`
              : m.daysRemaining === 0
              ? "Expires today"
              : `${m.daysRemaining}d left`}
          </span>
          <WhatsAppButton member={m} variant="icon" />
        </div>
      ))}
    </div>
  );
}
