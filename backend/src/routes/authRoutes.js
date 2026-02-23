const express = require("express");
const {
  register,
  login,
  web3Login,
  web3Onboard,
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
router.post("/web3-login", web3Login);
router.post("/web3-onboard", authenticateToken, web3Onboard);
router.post("/invite", authenticateToken, requireAdmin, inviteEmployee);
router.post("/complete-invite", authenticateToken, completeInvite);
router.get("/me", authenticateToken, getMe);
router.put("/me", authenticateToken, updateProfile);

module.exports = router;
