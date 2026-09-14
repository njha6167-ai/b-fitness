import Modal from "./Modal";

export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger = true, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-sm">
      <p className="text-sm text-gym-muted">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-md border border-gym-border px-4 py-2 text-sm font-medium text-gym-text hover:bg-gym-panel2"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            danger
              ? "bg-status-expired text-white hover:bg-status-expired/90"
              : "bg-gym-gold text-gym-bg hover:bg-gym-gold/90"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
