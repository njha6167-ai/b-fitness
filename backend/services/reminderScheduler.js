const cron = require("node-cron");
const Member = require("../models/Member");
const Reminder = require("../models/Reminder");
const Settings = require("../models/Settings");
const whatsappService = require("./whatsappService");
const { daysRemaining, formatLongDate } = require("../utils/dateUtils");

function reminderTypeFor(days) {
  return days === 0 ? "on_expiry" : `${days}_day`;
}

/**
 * Runs once: checks every member against the configured reminderDays list
 * and sends (or queues) a WhatsApp reminder for anyone due today.
 * Safe to call multiple times a day — already-sent automatic reminders for
 * the same member + reminder type + expiry cycle are skipped.
 *
 * Returns a summary object, useful for logging and for the manual
 * "run now" endpoint used during setup/testing.
 */
async function runReminderCheck() {
  const settings = await Settings.getSettings();
  const reminderDays = [...new Set(settings.reminderDays)].sort((a, b) => b - a);
  const members = await Member.find({});

  const summary = { checked: members.length, dueToday: 0, sent: 0, queued: 0, failed: 0, skipped: 0 };

  for (const member of members) {
    const remaining = daysRemaining(member.expiryDate);
    if (!reminderDays.includes(remaining)) continue; // not a reminder day for this member

    summary.dueToday += 1;
    const reminderType = reminderTypeFor(remaining);

    // Duplicate prevention: has an automatic reminder of this type already
    // been sent for THIS expiry cycle? (expiryDateSnapshot ties it to the
    // current membership period — renewing resets this naturally.)
    const alreadySent = await Reminder.findOne({
      memberId: member._id,
      reminderType,
      expiryDateSnapshot: member.expiryDate,
      channel: "api",
      status: "sent",
    });
    if (alreadySent) {
      summary.skipped += 1;
      continue;
    }

    const message = whatsappService.fillTemplate(settings.messageTemplate, {
      memberName: member.name,
      expiryDate: formatLongDate(member.expiryDate),
      gymName: settings.gymName,
    });

    if (whatsappService.isConfigured()) {
      try {
        const result = await whatsappService.sendTemplateMessage({
          to: member.phone,
          bodyParams: [member.name, formatLongDate(member.expiryDate), settings.gymName],
        });
        await Reminder.create({
          memberId: member._id,
          reminderType,
          expiryDateSnapshot: member.expiryDate,
          scheduledDate: new Date(),
          sentAt: new Date(),
          status: "sent",
          channel: "api",
          message,
          whatsappMessageId: result?.messages?.[0]?.id || null,
        });
        summary.sent += 1;
      } catch (err) {
        await Reminder.create({
          memberId: member._id,
          reminderType,
          expiryDateSnapshot: member.expiryDate,
          scheduledDate: new Date(),
          status: "failed",
          channel: "api",
          message,
          errorMessage: err?.response?.data
            ? JSON.stringify(err.response.data)
            : err.message,
        });
        summary.failed += 1;
      }
    } else {
      // No API credentials: queue it as pending so it shows up in the
      // dashboard / member profile for the gym owner to send manually.
      const alreadyQueued = await Reminder.findOne({
        memberId: member._id,
        reminderType,
        expiryDateSnapshot: member.expiryDate,
        channel: "manual",
      });
      if (!alreadyQueued) {
        await Reminder.create({
          memberId: member._id,
          reminderType,
          expiryDateSnapshot: member.expiryDate,
          scheduledDate: new Date(),
          status: "pending",
          channel: "manual",
          message,
        });
        summary.queued += 1;
      } else {
        summary.skipped += 1;
      }
    }
  }

  return summary;
}

/** Registers the daily cron job. Call once from server.js after DB connects. */
function startReminderScheduler() {
  const expression = process.env.REMINDER_CRON || "0 9 * * *";
  if (!cron.validate(expression)) {
    console.error(`[Scheduler] Invalid REMINDER_CRON expression "${expression}" — scheduler not started.`);
    return;
  }
  cron.schedule(expression, async () => {
    console.log("[Scheduler] Running daily reminder check...");
    try {
      const summary = await runReminderCheck();
      console.log("[Scheduler] Reminder check complete:", summary);
    } catch (err) {
      console.error("[Scheduler] Reminder check failed:", err.message);
    }
  });
  console.log(`[Scheduler] Daily reminder check scheduled ("${expression}")`);
}

module.exports = { startReminderScheduler, runReminderCheck };
