const express = require("express");
const {
  getEmployees,
  addEmployee,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");
const { authenticateToken } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/adminMiddleware");

const router = express.Router();

router.use(authenticateToken);

// Readable by admins only (employees see their own record via /auth/me)
router.get("/", requireAdmin, getEmployees);
router.post("/", requireAdmin, addEmployee);
router.put("/:id", requireAdmin, updateEmployee);
router.delete("/:id", requireAdmin, deleteEmployee);

module.exports = router;
