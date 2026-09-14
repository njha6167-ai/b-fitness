/**
 * Adds calendar months to a date, correctly matching the "add N months"
 * behaviour used for membership durations (e.g. 14 Sep 2026 + 1 month =
 * 14 Oct 2026).
 */
function addMonths(date, months) {
  const result = new Date(date);
  const targetMonth = result.getMonth() + months;
  result.setMonth(targetMonth);
  // Guard against month-overflow edge cases (e.g. 31 Jan + 1 month should
  // land on the last day of Feb, not roll into March).
  if (result.getDate() !== new Date(date).getDate()) {
    result.setDate(0);
  }
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const DURATION_MONTHS = {
  "1_month": 1,
  "3_months": 3,
  "6_months": 6,
  "12_months": 12,
};

const DURATION_LABELS = {
  "1_month": "1 Month",
  "3_months": "3 Months",
  "6_months": "6 Months",
  "12_months": "12 Months",
};

/**
 * Calculates an expiry date from a start date + duration selection.
 * durationType: "1_month" | "3_months" | "6_months" | "12_months" | "custom"
 * customDays: required only when durationType === "custom"
 */
function calculateExpiryDate(startDate, durationType, customDays) {
  const start = new Date(startDate);
  if (durationType === "custom") {
    const days = Number(customDays);
    if (!days || days <= 0) {
      throw new Error("customDays must be a positive number when durationType is 'custom'");
    }
    return addDays(start, days);
  }
  const months = DURATION_MONTHS[durationType];
  if (!months) {
    throw new Error(`Unknown durationType: ${durationType}`);
  }
  return addMonths(start, months);
}

function durationLabel(durationType, customDays) {
  if (durationType === "custom") {
    return `Custom (${customDays} days)`;
  }
  return DURATION_LABELS[durationType] || durationType;
}

/** Whole days remaining until expiryDate, counted from the start of today. Negative = already expired. */
function daysRemaining(expiryDate, from = new Date()) {
  const startOfToday = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const expiry = new Date(expiryDate);
  const startOfExpiry = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((startOfExpiry - startOfToday) / msPerDay);
}

/** active | expiring | expired, based on days remaining and the configurable threshold. */
function computeStatus(expiryDate, expiringSoonThresholdDays = 7, from = new Date()) {
  const remaining = daysRemaining(expiryDate, from);
  if (remaining < 0) return "expired";
  if (remaining <= expiringSoonThresholdDays) return "expiring";
  return "active";
}

/** Formats a date as "20 September 2026" (used inside WhatsApp messages). */
function formatLongDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

module.exports = {
  addMonths,
  addDays,
  calculateExpiryDate,
  durationLabel,
  daysRemaining,
  computeStatus,
  formatLongDate,
  DURATION_MONTHS,
  DURATION_LABELS,
};
