import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";

const Layout = ({ children }) => {
  const { user, userProfile, role } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const adminNavLinks = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: "dashboard",
      isGradient: false,
    },
    { name: "Employees", path: "/employees", icon: "group", isGradient: false },
    {
      name: "Invitations",
      path: "/invitations",
      icon: "mail",
      isGradient: false,
    },
    { name: "Tasks", path: "/tasks", icon: "task_alt", isGradient: false },
    {
      name: "AI Insights",
      path: "/analytics",
      icon: "auto_awesome",
      isGradient: true,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: "settings",
      isGradient: false,
    },
    {
      name: "My Profile",
      path: "/profile",
      icon: "person",
      isGradient: false,
    },
  ];

  const employeeNavLinks = [
    { name: "My Tasks", path: "/portal", icon: "task_alt", isGradient: false },
    { name: "My Profile", path: "/profile", icon: "person", isGradient: false },
  ];

  const navLinks = role === "employee" ? employeeNavLinks : adminNavLinks;

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 lg:flex z-20">
        <div className="flex h-16 items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white">
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontFamily: "Material Symbols Outlined" }}
              >
                dataset
              </span>
            </div>
            <div>
              <h1 className="text-base font-bold leading-none text-slate-900 dark:text-white">
                AI-HRMS
              </h1>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {role === "employee" ? "Employee Portal" : "Admin Portal"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);

              if (link.isGradient) {
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${isActive ? "bg-slate-50 dark:bg-slate-800" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                  >
                    <span
                      className="material-symbols-outlined text-purple-500 dark:text-purple-400"
                      style={{ fontFamily: "Material Symbols Outlined" }}
                    >
                      {link.icon}
                    </span>
                    <span className="text-sm font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-semibold">
                      {link.name}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${isActive ? "bg-blue-600/10 text-blue-600 dark:text-blue-400" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"}`}
                >
                  <span
                    className={`material-symbols-outlined ${isActive ? "filled" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"}`}
                    style={{ fontFamily: "Material Symbols Outlined" }}
                  >
                    {link.icon}
                  </span>
                  <span className="text-sm font-medium">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontFamily: "Material Symbols Outlined" }}
              >
                logout
              </span>
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              {location.pathname.split("/")[1] || "Dashboard"} Overview
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden w-64 md:block">
              <span
                className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]"
                style={{ fontFamily: "Material Symbols Outlined" }}
              >
                search
              </span>
              <input
                type="text"
                placeholder="Search employees, tasks..."
                className="h-10 w-full rounded-lg border-none bg-slate-100 pl-10 pr-4 text-sm text-slate-900 focus:ring-2 focus:ring-blue-600 dark:bg-slate-800 dark:text-white placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-6">
              <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors">
                <span
                  className="material-symbols-outlined"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  notifications
                </span>
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
              </button>

              <div className="flex items-center gap-3 pl-2">
                <div className="size-9 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                  {userProfile?.profile_picture_url ? (
                    <img
                      src={userProfile.profile_picture_url}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span
                      className="material-symbols-outlined h-full w-full flex items-center justify-center text-slate-400"
                      style={{ fontFamily: "Material Symbols Outlined" }}
                    >
                      person
                    </span>
                  )}
                </div>
                <div className="hidden flex-col md:flex">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.user_metadata?.name ||
                      (role === "employee" ? "Employee" : "Administrator")}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {role === "employee" ? "Employee" : "Admin"} · {user?.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
