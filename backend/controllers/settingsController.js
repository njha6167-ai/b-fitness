const Settings = require("../models/Settings");

/** GET /api/settings */
async function getSettings(req, res) {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** PUT /api/settings  body: { gymName?, reminderDays?, expiringSoonThresholdDays?, messageTemplate? } */
async function updateSettings(req, res) {
  try {
    const settings = await Settings.getSettings();
    const { gymName, reminderDays, expiringSoonThresholdDays, messageTemplate } = req.body;

    if (gymName !== undefined) settings.gymName = gymName;
    if (Array.isArray(reminderDays)) {
      settings.reminderDays = reminderDays
        .map(Number)
        .filter((n) => Number.isFinite(n) && n >= 0);
    }
    if (expiringSoonThresholdDays !== undefined) {
      settings.expiringSoonThresholdDays = Number(expiringSoonThresholdDays);
    }
    if (messageTemplate !== undefined) settings.messageTemplate = messageTemplate;

    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

module.exports = { getSettings, updateSettings };
