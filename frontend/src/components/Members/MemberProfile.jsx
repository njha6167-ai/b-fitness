import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Pencil, Trash2, RefreshCw, User, Phone, MapPin, Calendar, Cake } from "lucide-react";
import StatusBadge from "../shared/StatusBadge";
import WhatsAppButton from "../shared/WhatsAppButton";
import Modal from "../shared/Modal";
import ConfirmDialog from "../shared/ConfirmDialog";
import MemberForm from "./MemberForm";
import RenewMembershipModal from "./RenewMembershipModal";
import { getMember, updateMember, deleteMember } from "../../api/client";
import { formatLongDate, formatShortDate } from "../../utils/dateUtils";

const REMINDER_LABELS = {
  "7_day": "7 days before",
  "3_day": "3 days before",
  "1_day": "1 day before",
  on_expiry: "On expiry day",
  manual: "Manual send",
};

const STATUS_STYLES = {
  sent: "text-status-active",
  failed: "text-status-expired",
  pending: "text-status-expiring",
};

export default function MemberProfile({ memberId, onBack, onDeleted }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const load = useCallback(() => {
    getMember(memberId)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => setError(err?.response?.data?.error || err.message));
  }, [memberId]);

  useEffect(load, [load]);

  async function handleEdit(formData) {
    await updateMember(memberId, formData);
    setShowEdit(false);
    load();
  }

  async function handleDelete() {
    await deleteMember(memberId);
    onDeleted();
  }

  function handleRenewed() {
    setShowRenew(false);
    load();
  }

  if (error) {
    return (
      <div>
        <BackButton onBack={onBack} />
        <div className="rounded-md border border-status-expired/30 bg-status-expiredBg px-3 py-2 text-sm text-status-expired">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-sm text-gym-muted">Loading profile…</p>;

  const { member, reminderHistory } = data;

  return (
    <div>
      <BackButton onBack={onBack} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: identity card */}
        <div className="rounded-lg border border-gym-border bg-gym-panel p-6 text-center lg:col-span-1">
          {member.photo ? (
            <img
              src={member.photo}
              alt={member.name}
              className="mx-auto h-28 w-28 rounded-full object-cover"
            />
          ) : (
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gym-panel2 font-display text-4xl text-gym-muted">
              {member.name?.[0]?.toUpperCase()}
            </div>
          )}
          <h2 className="mt-4 font-display text-2xl tracking-wide text-gym-text">{member.name}</h2>
          <div className="mt-2 flex justify-center">
            <StatusBadge status={member.status} />
          </div>

          <div className="mt-5 space-y-2 text-left text-sm">
            <InfoRow icon={Phone} label={member.phone} />
            {member.age && <InfoRow icon={Cake} label={`${member.age} years · ${member.gender}`} />}
            {member.address && <InfoRow icon={MapPin} label={member.address} />}
            <InfoRow icon={Calendar} label={`Joined ${formatShortDate(member.joiningDate)}`} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-2">
            <WhatsAppButton member={member} variant="full" />
            <button
              onClick={() => setShowRenew(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gym-gold/40 px-3 py-2 text-sm font-medium text-gym-gold hover:bg-gym-gold/10"
            >
              <RefreshCw size={16} /> Renew Membership
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gym-border px-3 py-2 text-sm font-medium text-gym-text hover:bg-gym-panel2"
            >
              <Pencil size={16} /> Edit Member
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-status-expired/40 px-3 py-2 text-sm font-medium text-status-expired hover:bg-status-expiredBg"
            >
              <Trash2 size={16} /> Delete Member
            </button>
          </div>
        </div>

        {/* Right: membership + history */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-gym-border bg-gym-panel p-6">
            <h3 className="mb-4 font-display text-xl tracking-wide text-gym-text">Membership</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat label="Plan" value={member.membershipPlan} />
              <Stat label="Duration" value={member.durationLabel} />
              <Stat
                label="Days Remaining"
                value={
                  member.daysRemaining < 0
                    ? `${Math.abs(member.daysRemaining)}d overdue`
                    : `${member.daysRemaining}d`
                }
              />
              <Stat label="Start Date" value={formatShortDate(member.startDate)} />
              <Stat label="Expiry Date" value={formatShortDate(member.expiryDate)} />
            </div>
          </section>

          {member.renewalHistory?.length > 0 && (
            <section className="rounded-lg border border-gym-border bg-gym-panel p-6">
              <h3 className="mb-4 font-display text-xl tracking-wide text-gym-text">Renewal History</h3>
              <div className="space-y-2">
                {member.renewalHistory
                  .slice()
                  .reverse()
                  .map((r, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gym-border bg-gym-panel2/60 px-3 py-2 text-sm"
                    >
                      <span className="text-gym-text">{r.membershipPlan} · {r.durationLabel}</span>
                      <span className="text-gym-muted">
                        {formatShortDate(r.startDate)} → {formatShortDate(r.expiryDate)}
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          )}

          <section className="rounded-lg border border-gym-border bg-gym-panel p-6">
            <h3 className="mb-4 font-display text-xl tracking-wide text-gym-text">Reminder History</h3>
            {reminderHistory.length === 0 ? (
              <p className="text-sm text-gym-muted">No WhatsApp reminders have been triggered for this member yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gym-border text-gym-muted">
                      <th className="pb-2 pr-4 font-medium">Type</th>
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">Channel</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminderHistory.map((r) => (
                      <tr key={r._id} className="border-b border-gym-border/60 last:border-0">
                        <td className="py-2 pr-4 text-gym-text">{REMINDER_LABELS[r.reminderType] || r.reminderType}</td>
                        <td className="py-2 pr-4 text-gym-muted">
                          {formatShortDate(r.sentAt || r.scheduledDate)}
                        </td>
                        <td className="py-2 pr-4 text-gym-muted">
                          {r.channel === "api" ? "WhatsApp API (auto)" : "Manual link"}
                        </td>
                        <td className={`py-2 font-medium capitalize ${STATUS_STYLES[r.status] || ""}`}>
                          {r.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {showEdit && (
        <Modal title="Edit Member" onClose={() => setShowEdit(false)}>
          <MemberForm
            initialData={member}
            onSubmit={handleEdit}
            onCancel={() => setShowEdit(false)}
            submitLabel="Save Changes"
          />
        </Modal>
      )}

      {showRenew && (
        <RenewMembershipModal member={member} onClose={() => setShowRenew(false)} onRenewed={handleRenewed} />
      )}

      {showDelete && (
        <ConfirmDialog
          title="Delete Member"
          message={`Remove ${member.name} and their full reminder history? This can't be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}

function BackButton({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gym-muted hover:text-gym-text"
    >
      <ArrowLeft size={16} /> Back to Members
    </button>
  );
}

function InfoRow({ icon: Icon, label }) {
  return (
    <div className="flex items-start gap-2 text-gym-muted">
      <Icon size={14} className="mt-0.5 flex-shrink-0" />
      <span className="break-words">{label}</span>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-gym-muted">{label}</p>
      <p className="mt-0.5 font-medium text-gym-text">{value}</p>
    </div>
  );
}
