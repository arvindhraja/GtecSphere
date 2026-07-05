import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");

  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  // Logged in but wrong role
  if (!allowedRoles.includes(user.role)) {
    if (user.role === "student") {
      return <Navigate to="/student" replace />;
    }

    if (user.role === "coordinator") {
      return <Navigate to="/coordinator" replace />;
    }

    if (user.role === "admin") {
      return <Navigate to="/admin" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;