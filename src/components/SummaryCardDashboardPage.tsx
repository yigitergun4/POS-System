export default function SummaryCardDashboardPage({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    purple: "bg-purple-100 text-purple-800",
    orange: "bg-orange-100 text-orange-800",
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-5 border border-gray-200">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <span
        className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-medium ${colors[color]}`}
      >
        Güncel
      </span>
    </div>
  );
}
