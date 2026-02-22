const { supabaseAdmin } = require("../db");

// Get the org_id for any user (admin or employee)
const getOrgId = (req) => req.userProfile?.org_id || null;

exports.getTasks = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) return res.status(403).json({ error: "No org context" });

    const isEmployee = req.userProfile?.role === "employee";
    let query = supabaseAdmin
      .from("tasks")
      .select(`*, employees ( name, role, department )`)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    // Employee sees only their own tasks
    if (isEmployee && req.userProfile.employee_id) {
      query = query.eq("employee_id", req.userProfile.employee_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addTask = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) return res.status(403).json({ error: "No org context" });

    const { employee_id, title, description } = req.body;
    if (!title || !employee_id) {
      return res
        .status(400)
        .json({ error: "Title and employee_id are required" });
    }

    const { data, error } = await supabaseAdmin
      .from("tasks")
      .insert([
        { org_id: orgId, employee_id, title, description, status: "Assigned" },
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) return res.status(403).json({ error: "No org context" });

    const taskId = req.params.id;
    const { status, tx_hash } = req.body;

    if (!["Assigned", "In Progress", "Completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    // Build match query — employees can only update their own tasks
    const isEmployee = req.userProfile?.role === "employee";
    let matchQuery = supabaseAdmin
      .from("tasks")
      .select("*")
      .match({ id: taskId, org_id: orgId });

    if (isEmployee && req.userProfile.employee_id) {
      matchQuery = matchQuery.eq("employee_id", req.userProfile.employee_id);
    }

    const { data: existingTask, error: fetchError } = await matchQuery.single();
    if (fetchError || !existingTask) {
      return res.status(404).json({ error: "Task not found" });
    }

    let updates = { status };
    if (tx_hash) updates.tx_hash = tx_hash;

    // AI Logic: Productivity Scoring
    let newScore = null;
    if (status === "Completed" && existingTask.status !== "Completed") {
      updates.completed_at = new Date().toISOString();

      const { data: emp } = await supabaseAdmin
        .from("employees")
        .select("productivity_score")
        .eq("id", existingTask.employee_id)
        .single();

      let currentScore = emp ? emp.productivity_score : 0;
      let pointsEarned = 10;

      const hoursTaken =
        (new Date().getTime() - new Date(existingTask.created_at).getTime()) /
        (1000 * 60 * 60);

      if (hoursTaken < 48) pointsEarned += 5;
      else if (hoursTaken > 168) pointsEarned -= 2;

      newScore = currentScore + pointsEarned;

      await supabaseAdmin
        .from("employees")
        .update({ productivity_score: newScore })
        .eq("id", existingTask.employee_id);
    }

    const { data: updatedTask, error: updateError } = await supabaseAdmin
      .from("tasks")
      .update(updates)
      .match({ id: taskId, org_id: orgId })
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      task: updatedTask,
      ai_insight:
        newScore !== null
          ? `Employee productivity score updated to ${newScore}`
          : null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
