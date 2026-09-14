import { useState } from "react";
import { DURATION_OPTIONS, calculateExpiryDate, formatLongDate, toInputDate } from "../../utils/dateUtils";
import Modal from "../shared/Modal";
import { renewMember } from "../../api/client";

export default function RenewMembershipModal({ member, onClose, onRenewed }) {
  const [durationType, setDurationType] = useState("1_month");
  const [customDurationDays, setCustomDurationDays] = useState("");
  const [startDate, setStartDate] = useState(toInputDate(member.expiryDate));
  const [membershipPlan, setMembershipPlan] = useState(member.membershipPlan);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const newExpiry = calculateExpiryDate(startDate, durationType, customDurationDays);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (durationType === "custom" && !(Number(customDurationDays) > 0)) {
      setError("Enter a valid number of custom days.");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await renewMember(member._id, {
        durationType,
        customDurationDays: durationType === "custom" ? customDurationDays : undefined,
        startDate,
        membershipPlan,
      });
      onRenewed(updated);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Renew Membership" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-md border border-status-expired/30 bg-status-expiredBg px-3 py-2 text-sm text-status-expired">
            {error}
          </div>
        )}

        <div className="rounded-md border border-gym-border bg-gym-panel2/60 px-3 py-2 text-sm">
          <span className="text-gym-muted">Current expiry: </span>
          <span className="font-medium text-gym-text">{formatLongDate(member.expiryDate)}</span>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gym-text">Membership Plan</span>
          <input
            value={membershipPlan}
            onChange={(e) => setMembershipPlan(e.target.value)}
            className="input"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gym-text">Renewal Start Date</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input" />
          <span className="mt-1 block text-xs text-gym-muted">
            Defaults to the current expiry date so the new cycle continues right after the old one.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gym-text">New Duration</span>
          <select value={durationType} onChange={(e) => setDurationType(e.target.value)} className="input">
            {DURATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {durationType === "custom" && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gym-text">Custom Duration (days)</span>
            <input
              type="number"
              min="1"
              value={customDurationDays}
              onChange={(e) => setCustomDurationDays(e.target.value)}
              className="input sm:max-w-[200px]"
            />
          </label>
        )}

        <div className="rounded-md border border-gym-gold/30 bg-gym-gold/10 px-3 py-2 text-sm">
          <span className="text-gym-muted">New expiry: </span>
          <span className="font-medium text-gym-gold">
            {newExpiry ? formatLongDate(newExpiry) : "—"}
          </span>
        </div>

        <div className="flex justify-end gap-3 border-t border-gym-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gym-border px-4 py-2 text-sm font-medium text-gym-text hover:bg-gym-panel2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-gym-gold px-4 py-2 text-sm font-semibold text-gym-bg hover:bg-gym-gold/90 disabled:opacity-60"
          >
            {submitting ? "Renewing…" : "Confirm Renewal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
