const mongoose = require("mongoose");

const DEFAULT_TEMPLATE =
  "Hello {memberName} 👋\n\n" +
  "Your {gymName} gym membership will expire on {expiryDate}.\n\n" +
  "Please renew your membership to continue your workouts without interruption.\n\n" +
  "Thank you,\n{gymName}";

const settingsSchema = new mongoose.Schema(
  {
    // Singleton document — there should only ever be one row in this collection.
    singletonKey: { type: String, default: "app_settings", unique: true },

    gymName: { type: String, default: "B-FITNESS" },

    // Days-before-expiry to trigger a reminder. 0 = the expiry day itself.
    reminderDays: { type: [Number], default: [7, 3, 1, 0] },

    // "Expiring soon" threshold used for the dashboard card / status badge.
    expiringSoonThresholdDays: { type: Number, default: 7 },

    messageTemplate: { type: String, default: DEFAULT_TEMPLATE },
  },
  { timestamps: true }
);

settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ singletonKey: "app_settings" });
  if (!settings) {
    settings = await this.create({ singletonKey: "app_settings" });
  }
  return settings;
};

module.exports = mongoose.model("Settings", settingsSchema);
