const express = require("express");
const {
  register,
  login,
  inviteEmployee,
  completeInvite,
  updateProfile,
  getMe,
} = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/invite", authenticateToken, requireAdmin, inviteEmployee);
router.post("/complete-invite", authenticateToken, completeInvite);
router.get("/me", authenticateToken, getMe);
router.put("/me", authenticateToken, updateProfile);

module.exports = router;
