import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SidebarButton from "./SidebarButton";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // Use router basename from Vite env to compute active state correctly
  const routerBase: string =
    (import.meta as any).env.BASE_URL?.replace(/\/$/, "") || "";

  const menuItems: { path: string; label: string; icon: string }[] = [
    { path: "/sales", label: "Satış", icon: "💰" },
    { path: "/dashboard", label: "Raporlar", icon: "📊" },
    { path: "/stock", label: "Stok", icon: "📦" },
    { path: "/settings", label: "Ayarlar", icon: "⚙️" },
  ];

  const isActive: (path: string) => boolean = (path: string): boolean => {
    const currentPath: string = location.pathname.startsWith(routerBase)
      ? location.pathname.slice(routerBase.length)
      : location.pathname;
    return currentPath === path;
  };

  const toggleCollapsed: () => void = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div
      className={`flex flex-col justify-between bg-white shadow-xl border-r border-gray-100 min-h-screen transition-all duration-300 ease-in-out ${
        collapsed ? "w-20" : "w-64"
      } ${className}`}
    >
      {/* Header */}
      <div>
        <div
          className={`p-4 ${
            collapsed ? "px-3" : "px-5"
          } border-b border-gray-100`}
        >
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-lg font-bold">P</span>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">
                  POS Sistemi
                </h2>
                <p className="text-xs text-gray-500">Yönetim Paneli</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <div className={`px-3 py-3 ${collapsed ? "text-center" : ""}`}>
          <button
            onClick={toggleCollapsed}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors duration-200"
            title={collapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
          >
            <span
              className={`transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            >
              ◀
            </span>
            {!collapsed && (
              <span className="text-sm font-medium">Menüyü Daralt</span>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`space-y-1 ${collapsed ? "px-2" : "px-3"} pb-4`}>
          {menuItems.map((item) => (
            <SidebarButton
              key={item.path}
              label={item.label}
              icon={item.icon}
              active={isActive(item.path)}
              collapsed={collapsed}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className={`${collapsed ? "p-2" : "p-4"} border-t border-gray-100`}>
        <SidebarButton
          label="Çıkış Yap"
          icon="🚪"
          danger
          collapsed={collapsed}
          onClick={() => {
            logout();
            navigate("/login");
          }}
        />
      </div>
    </div>
  );
}

