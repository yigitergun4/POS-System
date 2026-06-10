import {
  startOfDay,
  endOfDay,
  subDays,
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  format,
} from "date-fns";

export interface PredefinedReport {
  key: string;
  label: string;
  description: string;
  icon: string;
  getDateRange: (today: Date) => { from: Date; to: Date };
  getFilenameSuffix: (today: Date) => string;
}

export const PREDEFINED_REPORTS: PredefinedReport[] = [
  {
    key: "today",
    label: "Bugün",
    description: "Bugünkü tüm satışlar",
    icon: "📅",
    getDateRange: (today) => ({
      from: startOfDay(today),
      to: endOfDay(today),
    }),
    getFilenameSuffix: (today) => `Bugun_${format(today, "dd.MM.yyyy")}`,
  },
  {
    key: "yesterday",
    label: "Dün",
    description: "Dünkü tüm satışlar",
    icon: "⏳",
    getDateRange: (today) => {
      const yesterday = subDays(today, 1);
      return {
        from: startOfDay(yesterday),
        to: endOfDay(yesterday),
      };
    },
    getFilenameSuffix: (today) => {
      const yesterday: Date = subDays(today, 1);
      return `Dun_${format(yesterday, "dd.MM.yyyy")}`;
    },
  },
  {
    key: "thisWeek",
    label: "Bu Hafta",
    description: "Pazartesi'den bugüne",
    icon: "📆",
    getDateRange: (today) => ({
      from: startOfWeek(today, { weekStartsOn: 1 }),
      to: endOfDay(today),
    }),
    getFilenameSuffix: (today) => {
      const from: Date = startOfWeek(today, { weekStartsOn: 1 });
      return `BuHafta_${format(from, "dd.MM.yyyy")}_${format(today, "dd.MM.yyyy")}`;
    },
  },
  {
    key: "lastWeek",
    label: "Geçen Hafta",
    description: "Geçen haftanın tamamı (Pzt-Paz)",
    icon: "🗓️",
    getDateRange: (today) => {
      const prevWeek: Date = subWeeks(today, 1);
      return {
        from: startOfWeek(prevWeek, { weekStartsOn: 1 }),
        to: endOfWeek(prevWeek, { weekStartsOn: 1 }),
      };
    },
    getFilenameSuffix: (today) => {
      const prevWeek: Date = subWeeks(today, 1);
      const from: Date = startOfWeek(prevWeek, { weekStartsOn: 1 });
      const to: Date = endOfWeek(prevWeek, { weekStartsOn: 1 });
      return `GecenHafta_${format(from, "dd.MM.yyyy")}_${format(to, "dd.MM.yyyy")}`;
    },
  },
  {
    key: "thisMonth",
    label: "Bu Ay",
    description: "Ayın 1'inden bugüne",
    icon: "📊",
    getDateRange: (today) => ({
      from: startOfMonth(today),
      to: endOfDay(today),
    }),
    getFilenameSuffix: (today) => {
      const from: Date = startOfMonth(today);
      return `BuAy_${format(from, "dd.MM.yyyy")}_${format(today, "dd.MM.yyyy")}`;
    },
  },
  {
    key: "lastMonth",
    label: "Geçen Ay",
    description: "Geçen ayın tamamı",
    icon: "📉",
    getDateRange: (today) => {
      const prevMonth: Date = subMonths(today, 1);
      return {
        from: startOfMonth(prevMonth),
        to: endOfMonth(prevMonth),
      };
    },
    getFilenameSuffix: (today) => {
      const prevMonth: Date = subMonths(today, 1);
      const from: Date = startOfMonth(prevMonth);
      const to: Date = endOfMonth(prevMonth);
      return `GecenAy_${format(from, "dd.MM.yyyy")}_${format(to, "dd.MM.yyyy")}`;
    },
  },
  {
    key: "thisYear",
    label: "Bu Yıl",
    description: "1 Ocak'tan bugüne",
    icon: "🏆",
    getDateRange: (today) => ({
      from: startOfYear(today),
      to: endOfDay(today),
    }),
    getFilenameSuffix: (today) => {
      const from: Date = startOfYear(today);
      return `Yillik_${format(from, "dd.MM.yyyy")}_${format(today, "dd.MM.yyyy")}`;
    },
  },
];

export const getDashboardRangeSuffix = (
  range: "daily" | "weekly" | "monthly" | "custom",
  startDate: Date | null,
  endDate: Date | null
): string => {
  const today = new Date();
  if (range === "daily") {
    return `Gunluk_${format(today, "dd.MM.yyyy")}`;
  } else if (range === "weekly") {
    const from: Date = subWeeks(today, 1);
    return `Haftalik_${format(from, "dd.MM.yyyy")}_${format(today, "dd.MM.yyyy")}`;
  } else if (range === "monthly") {
    const from: Date = subMonths(today, 1);
    return `Aylik_${format(from, "dd.MM.yyyy")}_${format(today, "dd.MM.yyyy")}`;
  } else if (range === "custom") {
    if (startDate && endDate) {
      return `Ozel_${format(startDate, "dd.MM.yyyy")}_${format(endDate, "dd.MM.yyyy")}`;
    } else if (startDate) {
      return `Ozel_${format(startDate, "dd.MM.yyyy")}_ve_Sonrasi`;
    } else if (endDate) {
      return `Ozel_Baslangicsiz_${format(endDate, "dd.MM.yyyy")}`;
    }
  }
  return format(today, "dd.MM.yyyy");
};
