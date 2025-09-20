interface PaymentButtonProps {
  label: string;
  icon?: string;
  color: "green" | "blue" | "red";
  onClick?: () => void;
}

export default function PaymentButton({
  label,
  icon,
  color,
  onClick = () => {},
}: PaymentButtonProps) {
  const colorClasses: string =
    color === "green"
      ? "bg-green-600 hover:bg-green-700"
      : color === "blue"
      ? "bg-blue-600 hover:bg-blue-700"
      : "bg-red-600 hover:bg-red-700";

  return (
    <button
      onClick={onClick}
      className={`w-full py-4 ${colorClasses} text-white font-semibold rounded-xl shadow-md active:scale-95 transition-transform`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {label}
    </button>
  );
}
