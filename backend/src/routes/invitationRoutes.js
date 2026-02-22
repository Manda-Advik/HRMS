const express = require("express");
const { getInvitations } = require("../controllers/invitationController");
const { authenticateToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(authenticateToken, requireAdmin);
router.get("/", getInvitations);

module.exports = router;
