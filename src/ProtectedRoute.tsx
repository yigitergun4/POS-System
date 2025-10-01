import { Navigate, Outlet } from "react-router-dom";
import { isLoggedIn } from "./lib/auth";

export default function ProtectedRoute() {
  if (!isLoggedIn()) {
    console.log("ProtectedRoute çalıştı");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
