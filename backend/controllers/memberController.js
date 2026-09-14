const Member = require("../models/Member");
const Reminder = require("../models/Reminder");
const Settings = require("../models/Settings");
const {
  calculateExpiryDate,
  durationLabel,
  computeStatus,
} = require("../utils/dateUtils");
const { decorateMember, decorateMembers, startOfDay, endOfDay } = require("../services/expiryService");

function photoUrl(req, filename) {
  if (!filename) return null;
  return filename.startsWith("/uploads") ? filename : `/uploads/${filename}`;
}

/** GET /api/members?search=... */
async function getMembers(req, res) {
  try {
    const { search } = req.query;
    const settings = await Settings.getSettings();

    let query = {};
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query = { $or: [{ name: regex }, { phone: regex }] };
    }

    const members = await Member.find(query).sort({ createdAt: -1 });
    const decorated = decorateMembers(members, settings.expiringSoonThresholdDays);
    res.json(decorated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** GET /api/members/:id */
async function getMemberById(req, res) {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });

    const settings = await Settings.getSettings();
    const reminders = await Reminder.find({ memberId: member._id }).sort({ createdAt: -1 });

    res.json({
      member: decorateMember(member, settings.expiringSoonThresholdDays),
      reminderHistory: reminders,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/** POST /api/members (multipart/form-data, field "photo" optional) */
async function createMember(req, res) {
  try {
    const {
      name,
      phone,
      gender,
      age,
      address,
      joiningDate,
      membershipPlan,
      startDate,
      durationType,
      customDurationDays,
    } = req.body;

    if (!name || !phone || !joiningDate || !membershipPlan || !startDate || !durationType) {
      return res.status(400).json({ error: "Missing required member fields" });
    }

    const expiryDate = calculateExpiryDate(startDate, durationType, customDurationDays);
    const settings = await Settings.getSettings();
    const status = computeStatus(expiryDate, settings.expiringSoonThresholdDays);

    const member = await Member.create({
      name,
      phone,
      gender,
      age: age || undefined,
      address,
      joiningDate,
      membershipPlan,
      startDate,
      durationType,
      durationLabel: durationLabel(durationType, customDurationDays),
      customDurationDays: durationType === "custom" ? customDurationDays : undefined,
      expiryDate,
      status,
      photo: req.file ? photoUrl(req, req.file.filename) : null,
    });

    res.status(201).json(decorateMember(member, settings.expiringSoonThresholdDays));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/** PUT /api/members/:id (multipart/form-data, field "photo" optional) */
async function updateMember(req, res) {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });

    const {
      name,
      phone,
      gender,
      age,
      address,
      joiningDate,
      membershipPlan,
      startDate,
      durationType,
      customDurationDays,
    } = req.body;

    if (name !== undefined) member.name = name;
    if (phone !== undefined) member.phone = phone;
    if (gender !== undefined) member.gender = gender;
    if (age !== undefined) member.age = age;
    if (address !== undefined) member.address = address;
    if (joiningDate !== undefined) member.joiningDate = joiningDate;
    if (membershipPlan !== undefined) member.membershipPlan = membershipPlan;

    const startChanged = startDate !== undefined;
    const durationChanged = durationType !== undefined;
    if (startChanged) member.startDate = startDate;
    if (durationChanged) member.durationType = durationType;
    if (customDurationDays !== undefined) member.customDurationDays = customDurationDays;

    if (startChanged || durationChanged) {
      member.expiryDate = calculateExpiryDate(
        member.startDate,
        member.durationType,
        member.customDurationDays
      );
      member.durationLabel = durationLabel(member.durationType, member.customDurationDays);
    }

    if (req.file) {
      member.photo = photoUrl(req, req.file.filename);
    }

    const settings = await Settings.getSettings();
    member.status = computeStatus(member.expiryDate, settings.expiringSoonThresholdDays);

    await member.save();
    res.json(decorateMember(member, settings.expiringSoonThresholdDays));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/** DELETE /api/members/:id */
async function deleteMember(req, res) {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });
    await Reminder.deleteMany({ memberId: member._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/members/:id/renew
 * body: { durationType, customDurationDays, startDate? }
 * If startDate is omitted, renewal continues from the member's current
 * expiry date (standard gym behaviour: renewing before/at expiry extends
 * from where the old cycle ends, not from today).
 */
async function renewMembership(req, res) {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return res.status(404).json({ error: "Member not found" });

    const { durationType, customDurationDays, startDate, membershipPlan } = req.body;
    if (!durationType) return res.status(400).json({ error: "durationType is required" });

    // Preserve the ending cycle in history before overwriting it.
    member.renewalHistory.push({
      membershipPlan: member.membershipPlan,
      durationLabel: member.durationLabel,
      startDate: member.startDate,
      expiryDate: member.expiryDate,
    });

    const newStart = startDate ? new Date(startDate) : member.expiryDate;
    const newExpiry = calculateExpiryDate(newStart, durationType, customDurationDays);

    member.startDate = newStart;
    member.durationType = durationType;
    member.customDurationDays = durationType === "custom" ? customDurationDays : undefined;
    member.durationLabel = durationLabel(durationType, customDurationDays);
    member.expiryDate = newExpiry;
    if (membershipPlan) member.membershipPlan = membershipPlan;

    const settings = await Settings.getSettings();
    member.status = computeStatus(member.expiryDate, settings.expiringSoonThresholdDays);

    await member.save();
    res.json(decorateMember(member, settings.expiringSoonThresholdDays));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

/** GET /api/members/stats/dashboard */
async function getDashboardStats(req, res) {
  try {
    const settings = await Settings.getSettings();
    const today = startOfDay();
    const thresholdEnd = endOfDay(
      new Date(today.getTime() + settings.expiringSoonThresholdDays * 24 * 60 * 60 * 1000)
    );

    const [total, expired, expiring, expiringMembers] = await Promise.all([
      Member.countDocuments({}),
      Member.countDocuments({ expiryDate: { $lt: today } }),
      Member.countDocuments({ expiryDate: { $gte: today, $lte: thresholdEnd } }),
      Member.find({ expiryDate: { $gte: today, $lte: thresholdEnd } }).sort({ expiryDate: 1 }),
    ]);

    const active = total - expired - expiring;

    res.json({
      total,
      active,
      expiring,
      expired,
      expiringSoonMembers: decorateMembers(expiringMembers, settings.expiringSoonThresholdDays),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  renewMembership,
  getDashboardStats,
};
