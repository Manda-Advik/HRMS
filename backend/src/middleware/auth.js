const { supabase, supabaseAdmin } = require("../db");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access token required" });

  // Verify JWT with Supabase
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  // Fetch role profile
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  req.user = user;
  req.userProfile = profile || null;
  next();
};

module.exports = { authenticateToken };
