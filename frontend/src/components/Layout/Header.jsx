export default function Header({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl tracking-wide text-gym-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gym-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
