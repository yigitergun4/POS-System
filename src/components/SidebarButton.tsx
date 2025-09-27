interface SidebarButtonProps {
  label: string;
  icon?: string;
  active?: boolean;
  danger?: boolean; // Çıkış butonu için
  onClick: () => void;
}

export default function SidebarButton({
  label,
  icon,
  active = false,
  danger = false,
  onClick,
}: SidebarButtonProps) {
  const base =
    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200";

  const colors = danger
    ? "bg-red-600 text-white shadow-md active:scale-95"
    : active
      ? "bg-blue-50 text-blue-700 border-2 border-blue-200"
      : "bg-gray-100 text-gray-900 border-2 border-gray-200";

  return (
    <button onClick={onClick} className={`${base} ${colors}`}>
      {icon && <span className="text-xl">{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
