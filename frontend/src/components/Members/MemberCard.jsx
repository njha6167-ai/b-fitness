import { Pencil, Trash2, Phone, Calendar } from "lucide-react";
import StatusBadge from "../shared/StatusBadge";
import WhatsAppButton from "../shared/WhatsAppButton";
import { formatShortDate } from "../../utils/dateUtils";

export default function MemberCard({ member, onSelect, onEdit, onDelete }) {
  const remaining = member.daysRemaining;
  const remainingLabel =
    remaining < 0 ? `${Math.abs(remaining)}d overdue` : remaining === 0 ? "Expires today" : `${remaining}d left`;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gym-border bg-gym-panel p-4 sm:flex-row sm:items-center">
      <button onClick={() => onSelect(member._id)} className="flex flex-1 items-center gap-4 text-left min-w-0">
        {member.photo ? (
          <img src={member.photo} alt={member.name} className="h-14 w-14 flex-shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gym-panel2 font-display text-2xl text-gym-muted">
            {member.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium text-gym-text">{member.name}</p>
            <StatusBadge status={member.status} size="sm" />
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gym-muted">
            <Phone size={12} /> {member.phone}
            <span className="mx-1">·</span>
            {member.membershipPlan}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gym-muted">
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {formatShortDate(member.startDate)} → {formatShortDate(member.expiryDate)}
            </span>
            <span
              className={
                remaining < 0
                  ? "font-medium text-status-expired"
                  : remaining <= 7
                  ? "font-medium text-status-expiring"
                  : "text-gym-muted"
              }
            >
              {remainingLabel}
            </span>
          </p>
        </div>
      </button>

      <div className="flex items-center justify-end gap-2 sm:flex-shrink-0">
        <WhatsAppButton member={member} variant="icon" />
        <button
          onClick={() => onEdit(member)}
          title="Edit member"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gym-border text-gym-muted hover:bg-gym-panel2 hover:text-gym-text"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => onDelete(member)}
          title="Delete member"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-status-expired/40 text-status-expired hover:bg-status-expiredBg"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
