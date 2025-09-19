import { useNavigate, useLocation } from "react-router-dom";
import SidebarButton from "./SidebarButton";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = "" }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: "/SalesPage", label: "Satış", icon: "💰" },
    { path: "/dashboard", label: "Raporlar", icon: "📊" },
    { path: "/stock", label: "Stok", icon: "📦" },
    { path: "/settings", label: "Ayarlar", icon: "⚙️" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className={`flex flex-col justify-between bg-white shadow-lg border-r border-gray-200 w-64 min-h-screen ${className}`}
    >
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <span className="text-lg font-bold">POS</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900">POS Sistemi</h2>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <SidebarButton
              key={item.path}
              label={item.label}
              icon={item.icon}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>
      </div>

      {/* Alt kısım çıkış butonu */}
      <div className="p-6 border-gray-200">
        <SidebarButton
          label="Çıkış Yap"
          icon="🚪"
          danger
          onClick={() => navigate("/")}
        />
      </div>
    </div>
  );
}
