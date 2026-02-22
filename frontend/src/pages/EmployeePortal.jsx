import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

import BACKEND from "../api";

const EmployeePortal = () => {
  const { session, user, employeeId } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/tasks`, { headers });
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchTasks();
  }, [session]);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      const res = await fetch(`${BACKEND}/api/tasks/${taskId}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      await fetchTasks();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const statusColors = {
    Assigned:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "In Progress":
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    Completed:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };

  const nextStatus = { Assigned: "In Progress", "In Progress": "Completed" };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Loading your tasks...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            My Tasks
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {user?.email} · {tasks.length} task{tasks.length !== 1 ? "s" : ""}{" "}
            assigned
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontFamily: "Material Symbols Outlined" }}
          >
            logout
          </span>
          Sign out
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {["Assigned", "In Progress", "Completed"].map((s) => (
          <div
            key={s}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
          >
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {tasks.filter((t) => t.status === s).length}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {s}
            </p>
          </div>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <span
              className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 block mb-3"
              style={{ fontFamily: "Material Symbols Outlined" }}
            >
              task_alt
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              No tasks assigned yet.
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 flex items-start justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[task.status]}`}
                  >
                    {task.status}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mt-2">
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                    {task.description}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  Assigned {new Date(task.created_at).toLocaleDateString()}
                </p>
              </div>

              {nextStatus[task.status] && (
                <button
                  onClick={() =>
                    handleStatusChange(task.id, nextStatus[task.status])
                  }
                  disabled={updatingId === task.id}
                  className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {updatingId === task.id
                    ? "Updating..."
                    : `Mark ${nextStatus[task.status]}`}
                </button>
              )}
              {task.status === "Completed" && (
                <span
                  className="material-symbols-outlined text-emerald-500 text-2xl shrink-0 mt-1"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  check_circle
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmployeePortal;
