const express = require("express");
const router = express.Router();
const { getStatus, sendReminder, triggerReminderCheck } = require("../controllers/whatsappController");

router.get("/status", getStatus);
router.post("/send-reminder", sendReminder);
router.post("/run-reminder-check", triggerReminderCheck);

module.exports = router;
