export default function StatCard({ label, value, icon: Icon, accent }) {
  const accentClasses = {
    gold: "text-gym-gold border-gym-gold/30",
    active: "text-status-active border-status-active/30",
    expiring: "text-status-expiring border-status-expiring/30",
    expired: "text-status-expired border-status-expired/30",
  };
  const cls = accentClasses[accent] || accentClasses.gold;

  return (
    <div className="rounded-lg border border-gym-border bg-gym-panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gym-muted">{label}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-md border ${cls}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 font-display text-4xl tracking-wide text-gym-text">{value}</p>
    </div>
  );
}
