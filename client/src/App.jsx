import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";

import WelcomePage from "./pages/WelcomePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";

import StudentDashboard from "./pages/StudentDashboard.jsx";
import CoordinatorDashboard from "./pages/coordinator/CoordinatorDashboard.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import CustomCursor from "./components/CustomCursor.jsx";

function PortalAnimation({ children, portal }) {
  return (
    <div className={`portal-animation portal-${portal}`}>
      <div className="portal-ambient-glow portal-glow-one" />
      <div className="portal-ambient-glow portal-glow-two" />

      <div className="portal-animation-content">
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <CustomCursor />

      <Routes>
        {/* WELCOME PAGE */}
        <Route
          path="/"
          element={<WelcomePage />}
        />

        {/* LOGIN / REGISTER PAGE */}
        <Route
          path="/login"
          element={<AuthPage />}
        />

        {/* STUDENT PORTAL */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <PortalAnimation portal="student">
                <StudentDashboard />
              </PortalAnimation>
            </ProtectedRoute>
          }
        />

        {/* COORDINATOR PORTAL */}
        <Route
          path="/coordinator"
          element={
            <ProtectedRoute allowedRoles={["coordinator"]}>
              <PortalAnimation portal="coordinator">
                <CoordinatorDashboard />
              </PortalAnimation>
            </ProtectedRoute>
          }
        />

        {/* ADMIN PORTAL */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <PortalAnimation portal="admin">
                <AdminDashboard />
              </PortalAnimation>
            </ProtectedRoute>
          }
        />

        {/* UNKNOWN ROUTES */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </>
  );
}

export default App;