const express = require("express");
const { getMetrics } = require("../controllers/dashboardController");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.use(authenticateToken);

router.get("/metrics", getMetrics);

module.exports = router;
