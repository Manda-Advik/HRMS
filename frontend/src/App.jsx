import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Tasks from "./pages/Tasks";
import Invitations from "./pages/Invitations";
import EmployeePortal from "./pages/EmployeePortal";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";

// Requires authentication — redirects to login if not logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

// Requires admin role — employees are redirected to /portal
const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role === "employee") return <Navigate to="/portal" />;
  return <Layout>{children}</Layout>;
};

// Employee-only route — admins are redirected to /dashboard
const EmployeeRoute = ({ children }) => {
  const { user, role, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role === "admin") return <Navigate to="/dashboard" />;
  return <Layout>{children}</Layout>;
};

// Redirects to correct home based on role after auth
const RoleRedirect = () => {
  const { user, role, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={role === "employee" ? "/portal" : "/dashboard"} />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin-only routes */}
          <Route
            path="/dashboard"
            element={
              <AdminRoute>
                <Dashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/employees"
            element={
              <AdminRoute>
                <Employees />
              </AdminRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <AdminRoute>
                <Tasks />
              </AdminRoute>
            }
          />
          <Route
            path="/invitations"
            element={
              <AdminRoute>
                <Invitations />
              </AdminRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <AdminRoute>
                <div className="p-8 text-slate-500">Analytics Coming Soon</div>
              </AdminRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <AdminRoute>
                <div className="p-8 text-slate-500">Settings Coming Soon</div>
              </AdminRoute>
            }
          />

          {/* Protected Routes (Admin + Employee) */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Employee-only routes */}
          <Route
            path="/portal"
            element={
              <EmployeeRoute>
                <EmployeePortal />
              </EmployeeRoute>
            }
          />

          {/* Accept invite — processed by AuthContext, then redirects */}
          <Route path="/accept-invite" element={<RoleRedirect />} />

          {/* Smart root redirect based on role */}
          <Route path="/" element={<RoleRedirect />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
