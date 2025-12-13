type SummaryCardProps = {
  title: string;
  value: string;
  color: "blue" | "green" | "purple" | "orange" | "red";
  icon?: string;
  subtitle?: string;
};

const CARD_STYLES: Record<
  string,
  { gradient: string; iconBg: string; textColor: string }
> = {
  blue: {
    gradient: "from-blue-500 to-blue-600",
    iconBg: "bg-blue-400/30",
    textColor: "text-blue-100",
  },
  green: {
    gradient: "from-emerald-500 to-emerald-600",
    iconBg: "bg-emerald-400/30",
    textColor: "text-emerald-100",
  },
  purple: {
    gradient: "from-purple-500 to-purple-600",
    iconBg: "bg-purple-400/30",
    textColor: "text-purple-100",
  },
  orange: {
    gradient: "from-orange-500 to-orange-600",
    iconBg: "bg-orange-400/30",
    textColor: "text-orange-100",
  },
  red: {
    gradient: "from-red-500 to-red-600",
    iconBg: "bg-red-400/30",
    textColor: "text-red-100",
  },
};

export default function SummaryCardDashboardPage({
  title,
  value,
  color,
  icon,
  subtitle,
}: SummaryCardProps) {
  const styles = CARD_STYLES[color];

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${styles.gradient} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 rounded-full bg-black/10 blur-xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <p className={`text-sm font-medium ${styles.textColor}`}>{title}</p>
          {icon && (
            <span
              className={`w-10 h-10 flex items-center justify-center rounded-xl ${styles.iconBg} text-xl`}
            >
              {icon}
            </span>
          )}
        </div>

        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>

        {subtitle && (
          <p className={`text-xs mt-2 ${styles.textColor}`}>{subtitle}</p>
        )}
      </div>
    </div>
  );
}

