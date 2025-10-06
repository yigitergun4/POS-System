import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SalesPage from "./pages/SalesPage";
import StockPage from "./pages/StockPage";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import Layout from "./components/Layout";
import { isLoggedIn } from "./lib/auth";
import { ToastContainer } from "react-toastify";

function ProtectedRoute() {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <Layout />;
}

export default function App() {
  return (
    <BrowserRouter basename="/POS-System">
      <ToastContainer />
      <Routes>
        <Route path="/POS-System/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/POS-System/sales" element={<SalesPage />} />
          <Route path="/POS-System/stock" element={<StockPage />} />
          <Route path="/POS-System/dashboard" element={<DashboardPage />} />
          <Route path="/POS-System/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/POS-System/sales" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
