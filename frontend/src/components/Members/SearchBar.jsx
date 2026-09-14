import { Search, X } from "lucide-react";

export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gym-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by name or mobile number"
        className="w-full rounded-md border border-gym-border bg-gym-panel2 py-2 pl-9 pr-8 text-sm text-gym-text placeholder:text-gym-muted focus:border-gym-gold"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gym-muted hover:text-gym-text"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
