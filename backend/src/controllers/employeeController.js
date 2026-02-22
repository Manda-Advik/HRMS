const { supabase } = require("../db");

const getOrgId = (req) => req.userProfile?.org_id || null;

exports.getEmployees = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) return res.status(403).json({ error: "No org context" });

    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addEmployee = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) return res.status(403).json({ error: "No org context" });
    const { name, role, department, skills, wallet_address } = req.body;

    if (!name || !role || !department) {
      return res
        .status(400)
        .json({ error: "Name, role, and department are required" });
    }

    const { data, error } = await supabase
      .from("employees")
      .insert([
        {
          org_id: orgId,
          name,
          role,
          department,
          skills: skills || [],
          wallet_address,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) return res.status(403).json({ error: "No org context" });
    const employeeId = req.params.id;
    const updates = req.body;

    // Prevent cross-org updates
    const { data: existing, error: findError } = await supabase
      .from("employees")
      .select("id")
      .match({ id: employeeId, org_id: orgId })
      .single();

    if (findError || !existing)
      return res.status(404).json({ error: "Employee not found" });

    const { data, error } = await supabase
      .from("employees")
      .update(updates)
      .match({ id: employeeId, org_id: orgId })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteEmployee = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) return res.status(403).json({ error: "No org context" });
    const employeeId = req.params.id;

    const { error } = await supabase
      .from("employees")
      .delete()
      .match({ id: employeeId, org_id: orgId });

    if (error) throw error;
    res.json({ success: true, message: "Employee deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
