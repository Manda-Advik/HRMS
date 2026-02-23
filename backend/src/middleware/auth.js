const { supabase, supabaseAdmin } = require("../db");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access token required" });

  // Step 1: Verify JWT with Supabase
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }

  // Step 2: Fetch the user's profile from Supabase
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Step 3: Attach org name from the organizations table
  if (profile) {
    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("name")
      .eq("id", profile.org_id || user.id)
      .single();
    if (org) profile.org_name = org.name;
  }

  req.user = user;
  req.userProfile = profile || null;
  next();
};

module.exports = { authenticateToken };
