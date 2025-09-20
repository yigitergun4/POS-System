interface TotalCardProps {
  total: number;
  label?: string;
}

export default function TotalCard({
  total,
  label = "Toplam Tutar",
}: TotalCardProps) {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 mb-6 border-2 border-gray-200">
      <p className="text-gray-600 text-sm font-medium">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">
        {total.toFixed(2)} ₺
      </p>
    </div>
  );
}
