import { X } from "lucide-react";
import { useEffect } from "react";

export default function Modal({ title, onClose, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-10 sm:pt-16">
      <div
        className={`w-full ${maxWidth} rounded-lg border border-gym-border bg-gym-panel shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gym-border px-5 py-4">
          <h2 className="font-display text-2xl tracking-wide text-gym-text">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gym-muted hover:bg-gym-panel2 hover:text-gym-text"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
