const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },

    // e.g. "7_day", "3_day", "1_day", "on_expiry", or "manual" for an
    // ad-hoc send. Not a strict enum because reminderDays is configurable
    // in Settings (a gym owner could add a "10_day" reminder, etc).
    reminderType: {
      type: String,
      required: true,
    },

    // The expiry date this reminder was calculated against. Renewing a
    // membership changes expiryDate, which naturally "unlocks" fresh
    // reminders for the new cycle without needing to delete old rows.
    expiryDateSnapshot: { type: Date, required: true },

    scheduledDate: { type: Date, required: true }, // the day the reminder became due
    sentAt: { type: Date },

    status: {
      type: String,
      enum: ["sent", "failed", "pending"],
      default: "pending",
    },

    // Distinguishes an automatic Cloud API send from a manual wa.me link click
    channel: {
      type: String,
      enum: ["api", "manual"],
      required: true,
    },

    message: { type: String },
    whatsappMessageId: { type: String, default: null },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

// One reminder of a given type, per member, per expiry cycle — prevents duplicates.
reminderSchema.index(
  { memberId: 1, reminderType: 1, expiryDateSnapshot: 1, channel: 1 },
  { unique: false }
);

module.exports = mongoose.model("Reminder", reminderSchema);
