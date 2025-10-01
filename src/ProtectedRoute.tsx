import { Navigate } from "react-router-dom";
import { isLoggedIn } from "./lib/auth";
import Layout from "./components/Layout";

export default function ProtectedRoute() {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}
