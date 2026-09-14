const { daysRemaining, computeStatus } = require("../utils/dateUtils");

/**
 * Takes a Mongoose Member document (or plain object) and returns a plain
 * object with live-computed daysRemaining/status attached. We compute this
 * on every read instead of trusting the stored `status` field alone, so the
 * numbers are always correct even between daily cron runs or right after
 * the "Expiring Soon" threshold is changed in Settings.
 */
function decorateMember(member, expiringSoonThresholdDays = 7) {
  const plain =
    typeof member.toObject === "function" ? member.toObject() : { ...member };
  const remaining = daysRemaining(plain.expiryDate);
  const status = computeStatus(plain.expiryDate, expiringSoonThresholdDays);
  return { ...plain, daysRemaining: remaining, status };
}

function decorateMembers(members, expiringSoonThresholdDays = 7) {
  return members.map((m) => decorateMember(m, expiringSoonThresholdDays));
}

/** Date range helpers used for accurate, index-friendly dashboard counts. */
function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

module.exports = { decorateMember, decorateMembers, startOfDay, endOfDay };
