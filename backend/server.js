require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Simplified CORS: allow any origin to access the API since we rely on JWT Bearer tokens for security
app.use(
  cors({
    origin: true, // Echoes back the request's origin automatically
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

// Routes
const authRoutes = require("./src/routes/authRoutes");
const employeeRoutes = require("./src/routes/employeeRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const invitationRoutes = require("./src/routes/invitationRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/invitations", invitationRoutes);

// Database sanity check route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "HRMS Backend is running." });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
