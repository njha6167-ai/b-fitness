const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  renewMembership,
  getDashboardStats,
} = require("../controllers/memberController");

router.get("/stats/dashboard", getDashboardStats);
router.get("/", getMembers);
router.get("/:id", getMemberById);
router.post("/", upload.single("photo"), createMember);
router.put("/:id", upload.single("photo"), updateMember);
router.delete("/:id", deleteMember);
router.post("/:id/renew", renewMembership);

module.exports = router;
