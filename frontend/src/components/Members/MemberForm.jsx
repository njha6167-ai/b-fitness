import { useEffect, useRef, useState } from "react";
import { Camera, User } from "lucide-react";
import { DURATION_OPTIONS, calculateExpiryDate, formatLongDate, toInputDate } from "../../utils/dateUtils";

const PLAN_SUGGESTIONS = ["Basic", "Standard", "Premium", "Strength + Cardio", "Personal Training"];

function todayInput() {
  return toInputDate(new Date());
}

export default function MemberForm({ initialData, onSubmit, onCancel, submitLabel = "Save Member" }) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
    gender: initialData?.gender || "Male",
    age: initialData?.age || "",
    address: initialData?.address || "",
    joiningDate: toInputDate(initialData?.joiningDate) || todayInput(),
    membershipPlan: initialData?.membershipPlan || "",
    startDate: toInputDate(initialData?.startDate) || todayInput(),
    durationType: initialData?.durationType || "1_month",
    customDurationDays: initialData?.customDurationDays || "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(initialData?.photo || null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const expiryPreview = calculateExpiryDate(form.startDate, form.durationType, form.customDurationDays);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (form.durationType === "custom" && !(Number(form.customDurationDays) > 0)) {
      setError("Enter a valid number of custom days.");
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === "customDurationDays" && form.durationType !== "custom") return;
      data.append(key, value);
    });
    if (photoFile) data.append("photo", photoFile);

    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md border border-status-expired/30 bg-status-expiredBg px-3 py-2 text-sm text-status-expired">
          {error}
        </div>
      )}

      {/* Photo */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-gym-border bg-gym-panel2"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Profile preview" className="h-full w-full object-cover" />
          ) : (
            <User size={28} className="text-gym-muted" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera size={18} className="text-white" />
          </div>
        </button>
        <div>
          <p className="text-sm font-medium text-gym-text">Profile Photo</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-gym-gold hover:underline"
          >
            {photoPreview ? "Change photo" : "Upload photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Member Name" required>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="input"
            placeholder="Rahul Sharma"
          />
        </Field>
        <Field label="Mobile Number" required>
          <input
            required
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="input"
            placeholder="91XXXXXXXXXX"
          />
        </Field>

        <Field label="Gender">
          <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="input">
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </Field>
        <Field label="Age">
          <input
            type="number"
            min="0"
            value={form.age}
            onChange={(e) => set("age", e.target.value)}
            className="input"
            placeholder="28"
          />
        </Field>

        <Field label="Address" full>
          <textarea
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
            className="input min-h-[70px] resize-none"
            placeholder="Street, area, city"
          />
        </Field>

        <Field label="Joining Date" required>
          <input
            required
            type="date"
            value={form.joiningDate}
            onChange={(e) => set("joiningDate", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Membership Plan" required>
          <input
            required
            list="plan-suggestions"
            value={form.membershipPlan}
            onChange={(e) => set("membershipPlan", e.target.value)}
            className="input"
            placeholder="Basic / Standard / Premium"
          />
          <datalist id="plan-suggestions">
            {PLAN_SUGGESTIONS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>

        <Field label="Membership Start Date" required>
          <input
            required
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Membership Duration" required>
          <select
            value={form.durationType}
            onChange={(e) => set("durationType", e.target.value)}
            className="input"
          >
            {DURATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>

        {form.durationType === "custom" && (
          <Field label="Custom Duration (days)" required full>
            <input
              required
              type="number"
              min="1"
              value={form.customDurationDays}
              onChange={(e) => set("customDurationDays", e.target.value)}
              className="input sm:max-w-[200px]"
              placeholder="45"
            />
          </Field>
        )}

        <Field label="Membership Expiry Date" full>
          <div className="input flex items-center bg-gym-panel2/60 text-gym-gold">
            {expiryPreview ? formatLongDate(expiryPreview) : "Select a start date and duration"}
          </div>
        </Field>
      </div>

      <div className="flex justify-end gap-3 border-t border-gym-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gym-border px-4 py-2 text-sm font-medium text-gym-text hover:bg-gym-panel2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-gym-gold px-4 py-2 text-sm font-semibold text-gym-bg hover:bg-gym-gold/90 disabled:opacity-60"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, required, full }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-sm font-medium text-gym-text">
        {label}
        {required && <span className="text-gym-gold"> *</span>}
      </span>
      {children}
    </label>
  );
}
