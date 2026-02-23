import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import BACKEND from "../api";

const Tasks = () => {
  const { session } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    employee_id: "",
    priority: "Medium",
  });

  const headers = {
    Authorization: `Bearer ${session?.access_token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchData = async () => {
    if (!session) return;
    try {
      const [tasksRes, empRes] = await Promise.all([
        fetch(`${BACKEND}/api/tasks`, { headers }),
        fetch(`${BACKEND}/api/employees`, { headers }),
      ]);
      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND}/api/tasks`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({
          title: "",
          description: "",
          employee_id: "",
          priority: "Medium",
        });
        fetchData();
      }
    } catch (err) {
      console.error("Failed to assign task", err);
    }
  };

  const updateStatus = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${BACKEND}/api/tasks/${taskId}/status`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const assignedTasks = tasks.filter((t) => t.status === "Assigned");
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
  const completedTasks = tasks.filter((t) => t.status === "Completed");

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400";
      case "medium":
        return "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400";
      case "low":
        return "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <div className="flex flex-col h-full relative -m-6 lg:-m-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 px-6 lg:px-8 pt-6 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Task Board
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage and track HR operations across the organization.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontFamily: "Material Symbols Outlined" }}
              >
                filter_list
              </span>
              Filter
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-600/20 transition-all hover:shadow-lg hover:shadow-blue-600/30 active:scale-95"
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontFamily: "Material Symbols Outlined" }}
              >
                add
              </span>
              Create Task
            </button>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex gap-2 overflow-x-auto pb-2 mt-2">
          <button className="flex h-8 shrink-0 items-center gap-2 rounded-full bg-slate-200 dark:bg-slate-800 px-3 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              All Tasks
            </span>
          </button>
          <button className="flex h-8 shrink-0 items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              My Tasks
            </span>
          </button>
        </div>
      </div>

      {/* Board Columns Container */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 lg:px-8 py-6">
        <div className="flex h-full min-w-full gap-6">
          {/* Column 1: Assigned */}
          <div className="flex h-full w-80 shrink-0 flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Assigned
                </h3>
                <span className="flex h-5 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 px-2 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                  {assignedTasks.length}
                </span>
              </div>
              <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <span
                  className="material-symbols-outlined"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  more_horiz
                </span>
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-4 pr-2">
              {assignedTasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority || "medium")}`}
                    >
                      {task.priority || "Medium"}
                    </span>
                    <button
                      onClick={() => updateStatus(task.id, "In Progress")}
                      className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 rounded px-2 py-1 transition-colors"
                    >
                      Start
                    </button>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 leading-snug mb-1">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {task.description}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold ring-2 ring-white dark:ring-slate-900 overflow-hidden uppercase">
                      {task.employees?.name?.substring(0, 2) || "NA"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: In Progress */}
          <div className="flex h-full w-80 shrink-0 flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  In Progress
                </h3>
                <span className="flex h-5 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 px-2 text-[10px] font-bold">
                  {inProgressTasks.length}
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-4 pr-2 bg-slate-100/50 dark:bg-slate-800/20 rounded-xl p-2 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              {inProgressTasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-all duration-200 ring-2 ring-blue-600/5"
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority || "medium")}`}
                    >
                      {task.priority || "Medium"}
                    </span>
                    <button
                      onClick={() => updateStatus(task.id, "Completed")}
                      className="text-xs bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 rounded px-2 py-1 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 leading-snug mb-1">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {task.description}
                    </p>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold ring-2 ring-white dark:ring-slate-900 uppercase">
                      {task.employees?.name?.substring(0, 2) || "NA"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="flex h-full w-80 shrink-0 flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  Completed
                </h3>
                <span className="flex h-5 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 text-[10px] font-bold">
                  {completedTasks.length}
                </span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto pb-4 pr-2">
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex flex-col gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 opacity-70 hover:opacity-100 p-4 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-green-50 dark:bg-green-900/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400">
                        Done
                      </span>
                    </div>
                    <div className="text-green-600">
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontFamily: "Material Symbols Outlined" }}
                      >
                        check_circle
                      </span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 line-through decoration-slate-400 leading-snug mb-1">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1">
                      AI Productivity Scored
                    </p>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-3">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 text-[10px] font-bold ring-2 ring-white dark:ring-slate-900 uppercase">
                      {task.employees?.name?.substring(0, 2) || "NA"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showForm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Create New Task
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  close
                </span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Task Title
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="e.g. Update Employee Handbook"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="Add details about this task..."
                  rows="3"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Assignee
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.employee_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          employee_id: e.target.value,
                        })
                      }
                      className="w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    >
                      <option value="">Select Employee</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontFamily: "Material Symbols Outlined" }}
                      >
                        expand_more
                      </span>
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Priority (Mocked)
                  </label>
                  <select className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600">
                    <option>Medium</option>
                    <option>High</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all"
                >
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontFamily: "Material Symbols Outlined" }}
                  >
                    auto_awesome
                  </span>
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
