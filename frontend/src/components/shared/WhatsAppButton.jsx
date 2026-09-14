import { useState } from "react";
import { MessageCircle, Check, Loader2, AlertTriangle } from "lucide-react";
import { sendWhatsappReminder } from "../../api/client";
import { formatLongDate } from "../../utils/dateUtils";

/**
 * variant: "icon" (compact, for list rows) | "full" (labeled button, for profile/dashboard)
 */
export default function WhatsAppButton({ member, reminderType, variant = "full", onSent }) {
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [manualLink, setManualLink] = useState(null);

  async function handleClick() {
    // If a previous automatic attempt failed, a second click just opens
    // the manual fallback link directly instead of retrying the API.
    if (state === "error" && manualLink) {
      window.open(manualLink, "_blank", "noopener,noreferrer");
      setState("sent");
      return;
    }

    setState("sending");
    try {
      const res = await sendWhatsappReminder({
        memberId: member._id,
        memberName: member.name,
        phoneNumber: member.phone,
        expiryDate: member.expiryDate,
        reminderType,
      });

      if (res.channel === "manual") {
        window.open(res.manualLink, "_blank", "noopener,noreferrer");
      }
      setState("sent");
      onSent?.(res);
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      const data = err?.response?.data;
      setManualLink(data?.manualLink || null);
      setState("error");
    }
  }

  const icon =
    state === "sending" ? (
      <Loader2 size={16} className="animate-spin" />
    ) : state === "sent" ? (
      <Check size={16} />
    ) : state === "error" ? (
      <AlertTriangle size={16} />
    ) : (
      <MessageCircle size={16} />
    );

  const label =
    state === "sending"
      ? "Sending…"
      : state === "sent"
      ? "Sent"
      : state === "error"
      ? "Retry (manual)"
      : "Send WhatsApp";

  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        disabled={state === "sending"}
        title={`WhatsApp ${member.name} — expires ${formatLongDate(member.expiryDate)}`}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors
          ${
            state === "error"
              ? "border-status-expired/40 text-status-expired hover:bg-status-expiredBg"
              : "border-status-active/40 text-status-active hover:bg-status-activeBg"
          }`}
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "sending"}
      className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors
        ${
          state === "error"
            ? "border-status-expired/40 text-status-expired hover:bg-status-expiredBg"
            : "border-status-active/40 text-status-active hover:bg-status-activeBg"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}
