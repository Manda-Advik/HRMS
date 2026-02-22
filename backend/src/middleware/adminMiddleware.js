const requireAdmin = (req, res, next) => {
  if (!req.userProfile || req.userProfile.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

module.exports = { requireAdmin };
