const CONFIG = {
  active: { label: "Active", dot: "bg-status-active", text: "text-status-active", bg: "bg-status-activeBg" },
  expiring: {
    label: "Expiring Soon",
    dot: "bg-status-expiring",
    text: "text-status-expiring",
    bg: "bg-status-expiringBg",
  },
  expired: { label: "Expired", dot: "bg-status-expired", text: "text-status-expired", bg: "bg-status-expiredBg" },
};

export default function StatusBadge({ status, size = "md" }) {
  const cfg = CONFIG[status] || CONFIG.active;
  const padding = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${cfg.bg} ${cfg.text} ${padding} font-medium whitespace-nowrap`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
