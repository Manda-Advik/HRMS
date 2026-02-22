import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import BACKEND from "../api";

const Dashboard = () => {
  const { user, session } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${session.access_token}`,
      };

      const res = await fetch(`${BACKEND}/api/dashboard/metrics`, { headers });
      if (res.ok) setMetrics(await res.json());
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-full items-center justify-center p-12">
        Loading HRMS Dashboard...
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6">
      {/* Stats Grid */}
      {metrics && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Employees
              </p>
              <div className="rounded-md bg-blue-50 dark:bg-blue-900/30 p-2 text-blue-600 dark:text-blue-400">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  groups
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.metrics.totalEmployees}
              </span>
              <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                <span
                  className="material-symbols-outlined text-[14px] mr-0.5"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  trending_up
                </span>
                12%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              vs last month
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Tasks
              </p>
              <div className="rounded-md bg-indigo-50 dark:bg-indigo-900/30 p-2 text-indigo-600 dark:text-indigo-400">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  assignment
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.metrics.tasks.total}
              </span>
              <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                <span
                  className="material-symbols-outlined text-[14px] mr-0.5"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  trending_up
                </span>
                5%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              vs last month
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                In Progress Tasks
              </p>
              <div className="rounded-md bg-amber-50 dark:bg-amber-900/30 p-2 text-amber-600 dark:text-amber-400">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  pending_actions
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.metrics.tasks.inProgress}
              </span>
              <span className="flex items-center text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">
                <span
                  className="material-symbols-outlined text-[14px] mr-0.5"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  trending_down
                </span>
                2%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              vs last week
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Completed Tasks
              </p>
              <div className="rounded-md bg-teal-50 dark:bg-teal-900/30 p-2 text-teal-600 dark:text-teal-400">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  task_alt
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.metrics.tasks.completed}
              </span>
              <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                <span
                  className="material-symbols-outlined text-[14px] mr-0.5"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  trending_up
                </span>
                8%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              vs last week
            </p>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productivity Trends Chart */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Productivity Trends
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  85% Efficiency
                </span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                  +5% vs last month
                </span>
              </div>
            </div>
            <select className="bg-slate-50 border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600 block p-2 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="relative h-64 w-full">
            <svg
              className="h-full w-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 800 200"
            >
              <line
                className="dark:stroke-slate-700"
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
                x1="0"
                x2="800"
                y1="0"
                y2="0"
              ></line>
              <line
                className="dark:stroke-slate-700"
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
                x1="0"
                x2="800"
                y1="50"
                y2="50"
              ></line>
              <line
                className="dark:stroke-slate-700"
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
                x1="0"
                x2="800"
                y1="100"
                y2="100"
              ></line>
              <line
                className="dark:stroke-slate-700"
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
                x1="0"
                x2="800"
                y1="150"
                y2="150"
              ></line>
              <line
                className="dark:stroke-slate-700"
                stroke="#e2e8f0"
                strokeWidth="1"
                x1="0"
                x2="800"
                y1="200"
                y2="200"
              ></line>

              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="#1c6bf2"
                    stopOpacity="0.2"
                  ></stop>
                  <stop
                    offset="100%"
                    stopColor="#1c6bf2"
                    stopOpacity="0"
                  ></stop>
                </linearGradient>
              </defs>
              <path
                d="M0 120 C 100 110, 150 140, 200 100 C 250 60, 300 80, 400 60 C 500 40, 600 70, 800 30 V 200 H 0 Z"
                fill="url(#chartGradient)"
              ></path>
              <path
                d="M0 120 C 100 110, 150 140, 200 100 C 250 60, 300 80, 400 60 C 500 40, 600 70, 800 30"
                fill="none"
                stroke="#1c6bf2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              ></path>
              <circle
                className="fill-white stroke-blue-600 stroke-2 dark:fill-slate-800"
                cx="200"
                cy="100"
                r="4"
              ></circle>
              <circle
                className="fill-white stroke-blue-600 stroke-2 dark:fill-slate-800"
                cx="400"
                cy="60"
                r="4"
              ></circle>
              <circle
                className="fill-white stroke-blue-600 stroke-2 dark:fill-slate-800"
                cx="800"
                cy="30"
                r="4"
              ></circle>
            </svg>
            <div className="flex justify-between mt-4 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
        </div>

        {/* AI Leaderboard (Re-used structure with new theme support) */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                AI Leaderboard
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Top performing employees
              </p>
            </div>
            <button className="text-slate-400 hover:text-blue-600">
              <span
                className="material-symbols-outlined"
                style={{ fontFamily: "Material Symbols Outlined" }}
              >
                more_horiz
              </span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {metrics?.leaderboard?.map((emp, idx) => (
                <li
                  key={idx}
                  className="py-3 flex justify-between items-center group"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {emp.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {emp.role}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {emp.productivity_score} Score
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
