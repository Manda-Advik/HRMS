import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import {
  LogOut,
  Home,
  Users,
  CheckSquare,
  User,
  Mail,
  ClipboardList,
  Bell,
} from "lucide-react";

const Navbar = () => {
  const { user, userProfile } = useAuth();
  const location = useLocation();

  const displayName =
    userProfile?.full_name || user?.email?.split("@")[0] || "User";
  const orgName = userProfile?.org_name || "My Organisation";
  const avatarUrl = userProfile?.profile_picture_url;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: Home },
    { name: "Employees", path: "/employees", icon: Users },
    { name: "Tasks", path: "/tasks", icon: ClipboardList },
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* ── Left: Logo + Nav ── */}
          <div className="flex items-center space-x-6">
            {/* Brand identity — shows org name and logged-in user */}
            <div className="flex items-center gap-3 mr-2">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 shrink-0">
                <span
                  className="material-symbols-outlined text-white text-[20px]"
                  style={{ fontFamily: "Material Symbols Outlined" }}
                >
                  grid_view
                </span>
              </div>
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">
                  {orgName}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                  {displayName}
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ── Right: Avatar + Logout ── */}
          <div className="flex items-center gap-3">
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
              title="My Profile"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                    {initials}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block max-w-[120px] truncate">
                {displayName}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
