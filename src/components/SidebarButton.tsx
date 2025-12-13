interface SidebarButtonProps {
  label: string;
  icon?: string;
  active?: boolean;
  danger?: boolean;
  collapsed?: boolean;
  onClick: () => void;
}

export default function SidebarButton({
  label,
  icon,
  active = false,
  danger = false,
  collapsed = false,
  onClick,
}: SidebarButtonProps) {
  const base: string =
    "w-full flex items-center gap-3 rounded-xl text-left font-medium transition-all duration-200 group relative";

  const padding: string = collapsed ? "px-3 py-3 justify-center" : "px-4 py-3";

  const colors: string = danger
    ? "bg-red-600 text-white shadow-md hover:bg-red-700 active:scale-95"
    : active
      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900";

  return (
    <button onClick={onClick} className={`${base} ${padding} ${colors}`}>
      {icon && (
        <span className={`text-xl ${collapsed ? "" : ""}`}>{icon}</span>
      )}
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
      
      {/* Tooltip for collapsed mode */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
          {label}
        </div>
      )}
    </button>
  );
}

