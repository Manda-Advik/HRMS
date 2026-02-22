import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import BACKEND from "../api";

const Employees = () => {
  const { user, session } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    role: "",
    department: "",
    wallet_address: "",
    skills: "",
  });

  const headers = {
    Authorization: `Bearer ${session?.access_token}`,
    "Content-Type": "application/json",
  };

  useEffect(() => {
    fetchEmployees();
  }, [session]);

  const fetchEmployees = async () => {
    if (!session) return;
    try {
      const res = await fetch(`${BACKEND}/api/employees`, {
        headers,
      });
      if (res.ok) setEmployees(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        ...formData,
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const res = await fetch(`${BACKEND}/api/employees`, {
        method: "POST",
        headers,
        body: JSON.stringify(formattedData),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({
          name: "",
          role: "",
          department: "",
          wallet_address: "",
          skills: "",
        });
        fetchEmployees();
      }
    } catch (err) {
      console.error("Failed to add employee", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return "NA";
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex flex-col h-full relative -m-6 lg:-m-8">
      {/* Page Header */}
      <div className="flex flex-col gap-6 px-6 lg:px-8 pt-6 pb-6 bg-slate-50 dark:bg-slate-950 z-10 transition-colors duration-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Employee Directory
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage your team members, roles, and permissions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="hidden sm:flex items-center justify-center size-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title="Export Data"
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontFamily: "Material Symbols Outlined" }}
              >
                download
              </span>
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm shadow-blue-500/30 transition-all active:scale-95"
            >
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontFamily: "Material Symbols Outlined" }}
              >
                add
              </span>
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full sm:max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span
                className="material-symbols-outlined text-slate-400 group-focus-within:text-blue-600 transition-colors"
                style={{ fontFamily: "Material Symbols Outlined" }}
              >
                search
              </span>
            </div>
            <input
              className="block w-full rounded-lg border-0 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-3 text-slate-900 dark:text-white shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-shadow"
              placeholder="Search by name, role, or department..."
              type="text"
            />
          </div>
          <div className="relative">
            <button
              className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm ring-1 ring-inset ring-slate-200 dark:ring-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              type="button"
            >
              <span
                className="material-symbols-outlined text-slate-500 dark:text-slate-400 text-[20px]"
                style={{ fontFamily: "Material Symbols Outlined" }}
              >
                filter_list
              </span>
              Filter
              <span
                className="material-symbols-outlined text-slate-400 text-[16px] ml-1"
                style={{ fontFamily: "Material Symbols Outlined" }}
              >
                expand_more
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 overflow-auto px-6 lg:px-8 pb-8">
        <div className="relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th
                  className="px-6 py-4 font-medium tracking-wider"
                  scope="col"
                >
                  <div className="flex items-center gap-1 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                    Name
                    <span
                      className="material-symbols-outlined text-[14px]"
                      style={{ fontFamily: "Material Symbols Outlined" }}
                    >
                      arrow_downward
                    </span>
                  </div>
                </th>
                <th
                  className="px-6 py-4 font-medium tracking-wider"
                  scope="col"
                >
                  Role
                </th>
                <th
                  className="px-6 py-4 font-medium tracking-wider"
                  scope="col"
                >
                  Department
                </th>
                <th
                  className="px-6 py-4 font-medium tracking-wider"
                  scope="col"
                >
                  Skills
                </th>
                <th
                  className="px-6 py-4 font-medium tracking-wider"
                  scope="col"
                >
                  Status
                </th>
                <th
                  className="px-6 py-4 font-medium tracking-wider text-right"
                  scope="col"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 transition-colors">
              {employees.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    No employees found. Click "Add Employee" to create one.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
                          {getInitials(emp.name)}
                        </div>
                        <div className="flex flex-col">
                          <div className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {emp.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {emp.wallet_address
                              ? `${emp.wallet_address.substring(0, 6)}...${emp.wallet_address.substring(38)}`
                              : "No Web3 Wallet"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-900 dark:text-slate-200 font-medium">
                        {emp.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-indigo-500"></div>
                        <span className="text-slate-700 dark:text-slate-300">
                          {emp.department}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {emp.skills?.map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 ring-1 ring-inset ring-slate-500/10 dark:ring-slate-500/30"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20 dark:ring-emerald-500/20">
                        <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit"
                        >
                          <span
                            className="material-symbols-outlined text-[20px]"
                            style={{ fontFamily: "Material Symbols Outlined" }}
                          >
                            edit
                          </span>
                        </button>
                        <button
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          <span
                            className="material-symbols-outlined text-[20px]"
                            style={{ fontFamily: "Material Symbols Outlined" }}
                          >
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showForm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Add New Employee
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
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Role
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="e.g. Software Engineer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Department
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                    placeholder="e.g. Engineering"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Web3 Wallet Address (Optional)
                </label>
                <input
                  type="text"
                  value={formData.wallet_address}
                  onChange={(e) =>
                    setFormData({ ...formData, wallet_address: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="0x..."
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Skills (Comma Separated)
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) =>
                    setFormData({ ...formData, skills: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="React, Node.js, Python"
                />
              </div>
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
                    save
                  </span>
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
