type ChartCardProps = {
  title: string;
  children: React.ReactNode;
  icon?: string;
  subtitle?: string;
};

export default function ChartCardDashboardPage({
  title,
  children,
  icon,
  subtitle,
}: ChartCardProps) {
  return (
    <div className="bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="text-2xl">{icon}</span>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-800">{title}</h2>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

