const express = require("express");
const {
  getTasks,
  addTask,
  updateTaskStatus,
} = require("../controllers/taskController");
const { authenticateToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(authenticateToken);

// Admin: see all org tasks; Employee: see only their own (handled in controller)
router.get("/", getTasks);
// Admin-only: create tasks
router.post("/", requireAdmin, addTask);
// Both admin and employee can update task status
router.put("/:id/status", updateTaskStatus);

module.exports = router;
