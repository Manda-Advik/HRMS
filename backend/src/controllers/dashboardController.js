const { supabase } = require("../db");

exports.getMetrics = async (req, res) => {
  try {
    const orgId = req.userProfile?.org_id;
    if (!orgId) return res.status(403).json({ error: "No org context" });

    const { count: totalEmployees } = await supabase
      .from("employees")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);

    const { data: tasks, error: taskError } = await supabase
      .from("tasks")
      .select("status")
      .eq("org_id", orgId);

    if (taskError) throw taskError;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "Completed").length;
    const inProgressTasks = tasks.filter(
      (t) => t.status === "In Progress",
    ).length;
    const assignedTasks = tasks.filter((t) => t.status === "Assigned").length;

    const { data: topPerformers } = await supabase
      .from("employees")
      .select("name, role, productivity_score")
      .eq("org_id", orgId)
      .order("productivity_score", { ascending: false })
      .limit(5);

    res.json({
      metrics: {
        totalEmployees: totalEmployees || 0,
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          assigned: assignedTasks,
        },
      },
      leaderboard: topPerformers || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
