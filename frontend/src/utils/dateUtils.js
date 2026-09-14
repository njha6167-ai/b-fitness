export const DURATION_OPTIONS = [
  { value: "1_month", label: "1 Month" },
  { value: "3_months", label: "3 Months" },
  { value: "6_months", label: "6 Months" },
  { value: "12_months", label: "12 Months" },
  { value: "custom", label: "Custom" },
];

const DURATION_MONTHS = {
  "1_month": 1,
  "3_months": 3,
  "6_months": 6,
  "12_months": 12,
};

function addMonths(date, months) {
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() !== originalDay) result.setDate(0);
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Mirrors backend/utils/dateUtils.js so the form can preview the expiry date live. */
export function calculateExpiryDate(startDate, durationType, customDays) {
  if (!startDate || !durationType) return null;
  const start = new Date(startDate);
  if (durationType === "custom") {
    const days = Number(customDays);
    if (!days || days <= 0) return null;
    return addDays(start, days);
  }
  const months = DURATION_MONTHS[durationType];
  if (!months) return null;
  return addMonths(start, months);
}

export function durationLabel(durationType, customDays) {
  if (durationType === "custom") return `Custom (${customDays || 0} days)`;
  return DURATION_OPTIONS.find((o) => o.value === durationType)?.label || durationType;
}

export function daysRemaining(expiryDate, from = new Date()) {
  const startOfToday = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const expiry = new Date(expiryDate);
  const startOfExpiry = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  return Math.round((startOfExpiry - startOfToday) / 86400000);
}

/** "20 September 2026" */
export function formatLongDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "20 Sep 2026" — compact form for table/card rows */
export function formatShortDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** yyyy-mm-dd for <input type="date"> values */
export function toInputDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
