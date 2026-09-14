const mongoose = require("mongoose");

const renewalHistorySchema = new mongoose.Schema(
  {
    membershipPlan: String,
    durationLabel: String, // e.g. "1 Month", "3 Months", "Custom (45 days)"
    startDate: Date,
    expiryDate: Date,
    renewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const memberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    photo: { type: String, default: null }, // stored as "/uploads/<filename>"
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Male",
    },
    age: { type: Number },
    address: { type: String, default: "" },

    joiningDate: { type: Date, required: true },

    membershipPlan: { type: String, required: true, trim: true },

    startDate: { type: Date, required: true },
    durationType: {
      type: String,
      enum: ["1_month", "3_months", "6_months", "12_months", "custom"],
      required: true,
    },
    durationLabel: { type: String, required: true }, // human readable, e.g. "1 Month" or "Custom (45 days)"
    customDurationDays: { type: Number }, // only used when durationType === "custom"

    expiryDate: { type: Date, required: true },

    // Cached status, refreshed by expiryService on every read/write and by the daily cron.
    // Kept in the DB (rather than purely computed) so dashboard counts can be queried cheaply.
    status: {
      type: String,
      enum: ["active", "expiring", "expired"],
      default: "active",
    },

    renewalHistory: { type: [renewalHistorySchema], default: [] },
  },
  { timestamps: true }
);

memberSchema.index({ name: "text", phone: "text" });

module.exports = mongoose.model("Member", memberSchema);
