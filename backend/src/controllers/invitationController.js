const { supabase } = require("../db");

// Admin: list all invitations for their org
exports.getInvitations = async (req, res) => {
  try {
    const orgId = req.userProfile.org_id;
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
