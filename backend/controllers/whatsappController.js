const Member = require("../models/Member");
const Reminder = require("../models/Reminder");
const Settings = require("../models/Settings");
const whatsappService = require("../services/whatsappService");
const { formatLongDate } = require("../utils/dateUtils");
const { runReminderCheck } = require("../services/reminderScheduler");

/** GET /api/whatsapp/status — lets the frontend know which mode is active. */
function getStatus(req, res) {
  res.json({ configured: whatsappService.isConfigured() });
}

/**
 * POST /api/whatsapp/send-reminder
 * body: { memberId?, memberName, phoneNumber, expiryDate, message?, reminderType? }
 *
 * - If Cloud API credentials are configured -> sends automatically through
 *   the real WhatsApp Business Cloud API (channel: "api").
 * - If not configured -> returns a wa.me manual link for the frontend to
 *   open, pre-filled with the message (channel: "manual"). This is never
 *   presented as if it were sent automatically.
 */
async function sendReminder(req, res) {
  try {
    const { memberId, memberName, phoneNumber, expiryDate, message, reminderType } = req.body;

    if (!phoneNumber || !memberName) {
      return res.status(400).json({ error: "memberName and phoneNumber are required" });
    }

    const settings = await Settings.getSettings();
    const finalMessage =
      message ||
      whatsappService.fillTemplate(settings.messageTemplate, {
        memberName,
        expiryDate: expiryDate ? formatLongDate(expiryDate) : "",
        gymName: settings.gymName,
      });

    const manualLink = whatsappService.buildManualLink(phoneNumber, finalMessage);

    if (whatsappService.isConfigured()) {
      try {
        const result = await whatsappService.sendTemplateMessage({
          to: phoneNumber,
          bodyParams: [memberName, expiryDate ? formatLongDate(expiryDate) : "", settings.gymName],
        });

        if (memberId) {
          await Reminder.create({
            memberId,
            reminderType: reminderType || "manual",
            expiryDateSnapshot: expiryDate || new Date(),
            scheduledDate: new Date(),
            sentAt: new Date(),
            status: "sent",
            channel: "api",
            message: finalMessage,
            whatsappMessageId: result?.messages?.[0]?.id || null,
          });
        }

        return res.json({
          channel: "api",
          success: true,
          whatsappMessageId: result?.messages?.[0]?.id || null,
          message: finalMessage,
        });
      } catch (err) {
        const errorMessage = err?.response?.data ? JSON.stringify(err.response.data) : err.message;

        if (memberId) {
          await Reminder.create({
            memberId,
            reminderType: reminderType || "manual",
            expiryDateSnapshot: expiryDate || new Date(),
            scheduledDate: new Date(),
            status: "failed",
            channel: "api",
            message: finalMessage,
            errorMessage,
          });
        }

        // Automatic send failed — still hand back the manual link so the
        // gym owner isn't stuck.
        return res.status(502).json({
          channel: "api",
          success: false,
          error: errorMessage,
          manualLink,
          message: finalMessage,
        });
      }
    }

    // No credentials configured -> manual path.
    if (memberId) {
      await Reminder.create({
        memberId,
        reminderType: reminderType || "manual",
        expiryDateSnapshot: expiryDate || new Date(),
        scheduledDate: new Date(),
        sentAt: new Date(),
        status: "sent",
        channel: "manual",
        message: finalMessage,
      });
    }

    res.json({ channel: "manual", success: true, manualLink, message: finalMessage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** POST /api/whatsapp/run-reminder-check — manually trigger the daily job (useful for testing). */
async function triggerReminderCheck(req, res) {
  try {
    const summary = await runReminderCheck();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getStatus, sendReminder, triggerReminderCheck };
