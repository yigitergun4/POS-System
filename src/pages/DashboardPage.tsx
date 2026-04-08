import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import SummaryCard from "../components/SummaryCardDashboardPage";
import ChartCard from "../components/ChartCardDashboardPage";
import ChatInterface from "../components/ChatInterface";
import DatePicker, { registerLocale } from "react-datepicker";
import { tr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import { Listbox } from "@headlessui/react";
import { db } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { startOfDay, endOfDay, subWeeks, subMonths, format } from "date-fns";
import {
  CartesianGrid,
  Line,
  XAxis,
  YAxis,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import type { Sale } from "../types/Sale";
import SalesTable from "../components/SalesTableRows";

// Register Chart.js elements
ChartJS.register(ArcElement, Tooltip, Legend);

// Register Turkish locale for date picker
registerLocale("tr", tr);

export default function DashboardPage() {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly" | "custom">(
    "daily"
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeReportTab, setActiveReportTab] = useState<"charts" | "list">(
    "charts"
  );
  const [showChat, setShowChat] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [showProfitKPIs, setShowProfitKPIs] = useState<boolean>(false);

  const options: {
    key: "daily" | "weekly" | "monthly" | "custom";
    label: string;
  }[] = [
      { key: "daily", label: "📅 Günlük" },
      { key: "weekly", label: "📆 Haftalık" },
      { key: "monthly", label: "🗓️ Aylık" },
      { key: "custom", label: "🎯 Özel" },
    ];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "sales"), (snapshot) => {
      const data: Sale[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Sale, "id">),
      }));
      setSales(data);
    });
    return () => unsubscribe();
  }, []);

  const filteredSales: Sale[] = useMemo(() => {
    let from: Date;
    let to: Date;
    const today = new Date();

    if (range === "daily") {
      from = startOfDay(today);
      to = endOfDay(today);
    } else if (range === "weekly") {
      from = subWeeks(today, 1);
      to = today;
    } else if (range === "monthly") {
      from = subMonths(today, 1);
      to = today;
    } else if (range === "custom" && startDate && endDate) {
      from = startDate;
      to = endDate;
    } else {
      return sales;
    }

    return sales.filter((s) => {
      const d = new Date(s.timestamp.seconds * 1000);
      return d >= from && d <= to;
    });
  }, [sales, range, startDate, endDate]);

  // Main KPIs - now filtered by selected category
  const { totalSales, cashSales, cardSales, familySales, avgBasket, transactionCounts, totalCommission } =
    useMemo(() => {
      let totalSales: number = 0;
      let cashSales: number = 0;
      let cardSales: number = 0;
      let familySales: number = 0;
      let totalCommission: number = 0;
      const cashTransactions = new Set<string>();
      const cardTransactions = new Set<string>();
      const familyTransactions = new Set<string>();
      const allTransactions = new Set<string>();

      filteredSales.forEach((s: Sale) => {
        if (selectedCategory === "Tümü") {
          // No category filter - use full sale totals
          totalSales += s.total;
          if (s.paymentMethod === "cash") {
            cashSales += s.total;
            cashTransactions.add(s.id);
          }
          if (s.paymentMethod === "card") {
            cardSales += s.total;
            cardTransactions.add(s.id);
          }
          if (s.paymentMethod === "family") {
            familySales += s.total;
            familyTransactions.add(s.id);
          }
          if (s.paymentMethod === "split" && s.splitDetails) {
            cashSales += s.splitDetails.cashAmount;
            cardSales += s.splitDetails.cardAmount;
            cashTransactions.add(s.id);
            cardTransactions.add(s.id);
          }
          if (s.cardCommission) {
            totalCommission += s.cardCommission;
          }
          allTransactions.add(s.id);
        } else {
          // Filter by category - calculate from items
          let saleTotal: number = 0;
          s.items.forEach((item) => {
            if (item.category === selectedCategory) {
              const itemTotal: number = (item.price || 0) * item.qty;
              saleTotal += itemTotal;
            }
          });

          if (saleTotal > 0) {
            totalSales += saleTotal;
            if (s.paymentMethod === "cash") {
              cashSales += saleTotal;
              cashTransactions.add(s.id);
            }
            if (s.paymentMethod === "card") {
              cardSales += saleTotal;
              cardTransactions.add(s.id);
            }
            if (s.paymentMethod === "family") {
              familySales += saleTotal;
              familyTransactions.add(s.id);
            }
            if (s.paymentMethod === "split" && s.splitDetails) {
              const ratio: number = saleTotal / s.total;
              cashSales += s.splitDetails.cashAmount * ratio;
              cardSales += s.splitDetails.cardAmount * ratio;
              cashTransactions.add(s.id);
              cardTransactions.add(s.id);
            }
            if (s.cardCommission) {
              const ratio: number = saleTotal / s.total;
              totalCommission += s.cardCommission * ratio;
            }
            allTransactions.add(s.id);
          }
        }
      });

      const nonFamilyTransactions: number = cashTransactions.size + cardTransactions.size;
      const avgBasket: string =
        nonFamilyTransactions > 0
          ? ((totalSales - familySales) / nonFamilyTransactions).toFixed(2)
          : "0";

      return {
        totalSales,
        cashSales,
        cardSales,
        familySales,
        avgBasket,
        transactionCounts: {
          total: allTransactions.size,
          cash: cashTransactions.size,
          card: cardTransactions.size,
          family: familyTransactions.size,
          nonFamily: nonFamilyTransactions,
        },
        totalCommission,
      };
    }, [filteredSales, selectedCategory]);
  const totalSalesWithoutFamily: number = totalSales - familySales;

  // Extract unique categories from sales data
  const categories = useMemo(() => {
    const categorySet = new Set<string>(["Tümü"]);
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        if (item.category) categorySet.add(item.category);
      });
    });
    return Array.from(categorySet);
  }, [filteredSales]);

  // Category-filtered KPIs
  const categoryKPIs = useMemo(() => {
    let categorySales = 0;
    let categoryUnits = 0;
    let categoryTransactions = 0;

    if (selectedCategory === "Tümü") {
      filteredSales.forEach((sale) => {
        if (sale.paymentMethod !== "family") {
          categorySales += sale.total;
          categoryTransactions++;
          sale.items.forEach((item) => {
            categoryUnits += item.qty;
          });
        }
      });
    } else {
      const relevantSales = new Set<string>();
      filteredSales.forEach((sale) => {
        if (sale.paymentMethod !== "family") {
          sale.items.forEach((item) => {
            if (item.category === selectedCategory) {
              categorySales += (item.price || 0) * item.qty;
              categoryUnits += item.qty;
              relevantSales.add(sale.id);
            }
          });
        }
      });
      categoryTransactions = relevantSales.size;
    }

    const avgTransaction = categoryTransactions > 0 ? categorySales / categoryTransactions : 0;

    return {
      categorySales,
      categoryUnits,
      categoryTransactions,
      avgTransaction,
    };
  }, [filteredSales, selectedCategory]);

  const categoryData: {
    labels: string[];
    datasets: { data: number[]; backgroundColor: string[] }[];
  } = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    filteredSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const cat = item.category || "Diğer";
        if (!categoryTotals[cat]) categoryTotals[cat] = 0;
        categoryTotals[cat] += (item.price || 0) * item.qty;
      });
    });

    return {
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          data: Object.values(categoryTotals),
          backgroundColor: [
            "#3b82f6",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#8b5cf6",
            "#6b7280",
          ],
        },
      ],
    };
  }, [filteredSales]);

  // Hourly sales data
  const hourlySalesData = useMemo(() => {
    const hourlyTotals: { [hour: number]: number } = {};

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyTotals[i] = 0;
    }

    filteredSales.forEach((sale) => {
      if (sale.paymentMethod !== "family") {
        const saleDate = new Date(sale.timestamp.seconds * 1000);
        const hour = saleDate.getHours();

        if (selectedCategory === "Tümü") {
          hourlyTotals[hour] += sale.total;
        } else {
          sale.items.forEach((item) => {
            if (item.category === selectedCategory) {
              hourlyTotals[hour] += (item.price || 0) * item.qty;
            }
          });
        }
      }
    });

    return Object.entries(hourlyTotals).map(([hour, total]) => ({
      hour: parseInt(hour),
      total,
      label: `${hour}:00`,
    }));
  }, [filteredSales, selectedCategory]);

  // Top selling products
  const topProducts = useMemo(() => {
    const productStats: Record<string, { qty: number; revenue: number }> = {};

    filteredSales.forEach((sale) => {
      if (sale.paymentMethod !== "family") {
        sale.items.forEach((item) => {
          if (selectedCategory === "Tümü" || item.category === selectedCategory) {
            if (!productStats[item.name]) {
              productStats[item.name] = { qty: 0, revenue: 0 };
            }
            productStats[item.name].qty += item.qty;
            productStats[item.name].revenue += (item.price || 0) * item.qty;
          }
        });
      }
    });

    return Object.entries(productStats)
      .map(([name, stats]) => ({
        name,
        ...stats,
      }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [filteredSales, selectedCategory]);

  // Profit/Loss Analysis
  const profitLoss = useMemo(() => {
    let totalRevenue: number = 0;
    let totalCost: number = 0;

    filteredSales.forEach((sale) => {
      if (sale.paymentMethod === "family") return;
      sale.items.forEach((item) => {
        if (selectedCategory !== "Tümü" && item.category !== selectedCategory) return;
        const revenue: number = (item.price || 0) * item.qty;
        const cost: number = (item.cost || 0) * item.qty;
        totalRevenue += revenue;
        totalCost += cost;
      });
    });

    const grossProfit: number = totalRevenue - totalCost - totalCommission;
    const profitMargin: number = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCost, grossProfit, profitMargin };
  }, [filteredSales, selectedCategory, totalCommission]);

  // Daily Profit Trend Data
  const profitTrendData = useMemo(() => {
    const dailyData: Map<number, { revenue: number; cost: number; commission: number }> = new Map();

    filteredSales.forEach((sale) => {
      if (sale.paymentMethod === "family") return;
      const d: Date = new Date(sale.timestamp.seconds * 1000);
      const dayStart: Date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const key: number = dayStart.getTime();

      const prev = dailyData.get(key) || { revenue: 0, cost: 0, commission: 0 };

      sale.items.forEach((item) => {
        if (selectedCategory !== "Tümü" && item.category !== selectedCategory) return;
        prev.revenue += (item.price || 0) * item.qty;
        prev.cost += (item.cost || 0) * item.qty;
      });

      if (sale.cardCommission) {
        if (selectedCategory === "Tümü") {
          prev.commission += sale.cardCommission;
        } else {
          let saleTotal = 0;
          sale.items.forEach(item => {
            if (item.category === selectedCategory) {
              saleTotal += (item.price || 0) * item.qty;
            }
          });
          if (saleTotal > 0) {
            const ratio = saleTotal / sale.total;
            prev.commission += sale.cardCommission * ratio;
          }
        }
      }

      dailyData.set(key, prev);
    });

    return Array.from(dailyData.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([ts, data]) => ({
        date: ts,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.revenue - data.cost - data.commission,
      }));
  }, [filteredSales, selectedCategory]);

  // Category Profit Breakdown
  const categoryProfitData = useMemo(() => {
    const catData: Record<string, { revenue: number; cost: number; units: number; commission: number }> = {};

    filteredSales.forEach((sale) => {
      if (sale.paymentMethod === "family") return;
      sale.items.forEach((item) => {
        const cat: string = item.category || "Diğer";
        if (selectedCategory !== "Tümü" && cat !== selectedCategory) return;
        if (!catData[cat]) catData[cat] = { revenue: 0, cost: 0, units: 0, commission: 0 };
        catData[cat].revenue += (item.price || 0) * item.qty;
        catData[cat].cost += (item.cost || 0) * item.qty;
        catData[cat].units += item.qty;
      });

      if (sale.cardCommission) {
        // Distribute commission among categories based on their share in this sale
        const saleCategoryTotals: Record<string, number> = {};
        sale.items.forEach(item => {
          const cat = item.category || "Diğer";
          saleCategoryTotals[cat] = (saleCategoryTotals[cat] || 0) + (item.price || 0) * item.qty;
        });

        Object.entries(saleCategoryTotals).forEach(([cat, catTotal]) => {
          if (selectedCategory !== "Tümü" && cat !== selectedCategory) return;
          if (catData[cat]) {
            const ratio = catTotal / sale.total;
            catData[cat].commission += sale.cardCommission! * ratio;
          }
        });
      }
    });

    return Object.entries(catData)
      .map(([category, data]) => ({
        category,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.revenue - data.cost - data.commission,
        margin: data.revenue > 0 ? ((data.revenue - data.cost - data.commission) / data.revenue) * 100 : 0,
        units: data.units,
      }))
      .sort((a, b) => b.profit - a.profit);
  }, [filteredSales, selectedCategory]);

  const paymentData: {
    labels: string[];
    datasets: { data: number[]; backgroundColor: string[] }[];
  } = {
    labels: ["Nakit", "Kart", "Aile"],
    datasets: [
      {
        data: [cashSales, cardSales, familySales],
        backgroundColor: ["#10b981", "#3b82f6", "#ef4444"],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar pageTitle="Raporlar" />
      <div className="p-6 flex-1 overflow-auto">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-2xl font-semibold text-gray-800">
            Raporlar ve Analizler
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChat(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              🤖 Maje
            </button>
            {/* Category Filter - Only visible in charts tab */}
            {activeReportTab === "charts" && (
              <Listbox value={selectedCategory} onChange={setSelectedCategory}>
                <div className="relative">
                  <Listbox.Button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 min-w-[150px] justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span>📦</span>
                      <span className="font-medium">{selectedCategory}</span>
                    </span>
                    <span>▾</span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-auto">
                    {categories.map((category) => (
                      <Listbox.Option
                        key={category}
                        value={category}
                        className={({ active }) =>
                          `cursor-pointer px-4 py-2.5 text-sm transition-colors ${active
                            ? "bg-purple-50 text-purple-700"
                            : "text-gray-700 hover:bg-gray-50"
                          } ${selectedCategory === category
                            ? "font-semibold bg-purple-100"
                            : ""
                          }`
                        }
                      >
                        {category}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </div>
              </Listbox>
            )}
            <Listbox value={range} onChange={(val) => setRange(val)}>
              <div className="relative">
                <Listbox.Button className="w-40 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm flex justify-between items-center">
                  {options.find((o) => o.key === range)?.label}
                  <span>▾</span>
                </Listbox.Button>
                <Listbox.Options className="absolute mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {options.map(({ key, label }) => (
                    <Listbox.Option
                      key={key}
                      value={key}
                      className={({ active }) =>
                        `cursor-pointer px-3 py-2 text-sm ${active ? "bg-blue-100 text-blue-700" : "text-gray-700"
                        }`
                      }
                    >
                      {label}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
            {range === "custom" && (
              <div className="flex items-center gap-2 text-sm relative z-50">
                <DatePicker
                  locale="tr"
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  placeholderText="Başlangıç"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  dateFormat="dd/MM/yyyy"
                  popperClassName="z-50"
                />
                <span>-</span>
                <DatePicker
                  locale="tr"
                  selected={endDate}
                  onChange={(date) => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate ?? undefined}
                  placeholderText="Bitiş"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  dateFormat="dd/MM/yyyy"
                  popperClassName="z-50"
                />
              </div>
            )}
          </div>
        </div>



        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <SummaryCard
            title={selectedCategory === "Tümü" ? "Toplam Satış" : `${selectedCategory} Satış`}
            value={`₺${totalSalesWithoutFamily.toLocaleString("tr-TR")}`}
            color="blue"
            icon="💰"
            subtitle={`${transactionCounts.nonFamily} işlem`}
          />
          <SummaryCard
            title="Nakit Satış"
            value={`₺${cashSales.toLocaleString("tr-TR")}`}
            color="green"
            icon="💵"
            subtitle={`${transactionCounts.cash} işlem`}
          />
          <SummaryCard
            title="Kart Satış"
            value={`₺${cardSales.toLocaleString("tr-TR")}`}
            color="purple"
            icon="💳"
            subtitle={`${transactionCounts.card} işlem / ₺${totalCommission.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} komisyon`}
          />
          <SummaryCard
            title="Aile Satış"
            value={`₺${familySales.toLocaleString("tr-TR")}`}
            color="red"
            icon="👨‍👩‍👧"
            subtitle={`${transactionCounts.family} işlem`}
          />
          <SummaryCard
            title="Ortalama Sepet"
            value={`₺${Number(avgBasket).toLocaleString("tr-TR")}`}
            color="orange"
            icon="🛒"
            subtitle="İşlem başına"
          />
          <SummaryCard
            title="Kart Komisyonu"
            value={`₺${totalCommission.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`}
            color="red"
            icon="📉"
            subtitle="%3.5 Banka kesintisi"
          />
        </div>

        {/* Profit/Loss KPI Toggle */}
        <button
          onClick={() => setShowProfitKPIs((prev: boolean) => !prev)}
          className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all text-sm font-medium text-gray-700"
        >
          <span>{showProfitKPIs ? "▼" : "▶"}</span>
          <span>📊 Kâr / Zarar Analizi</span>
        </button>
        {showProfitKPIs && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-100 text-sm font-medium">Toplam Ciro</span>
                <span className="text-2xl">💰</span>
              </div>
              <div className="text-2xl font-bold">
                ₺{profitLoss.totalRevenue.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-emerald-100 text-xs mt-1">Aile hariç satış geliri</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-red-100 text-sm font-medium">Toplam Maliyet</span>
                <span className="text-2xl">📉</span>
              </div>
              <div className="text-2xl font-bold">
                ₺{profitLoss.totalCost.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-red-100 text-xs mt-1">Toplam alış maliyeti</div>
            </div>
            <div className={`bg-gradient-to-br ${profitLoss.grossProfit >= 0 ? "from-green-500 to-green-600" : "from-rose-600 to-rose-700"} rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-medium">Brüt Kâr</span>
                <span className="text-2xl">{profitLoss.grossProfit >= 0 ? "📈" : "📉"}</span>
              </div>
              <div className="text-2xl font-bold">
                ₺{profitLoss.grossProfit.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-white/80 text-xs mt-1">Ciro - Maliyet - Komisyon</div>
            </div>
            <div className={`bg-gradient-to-br ${profitLoss.profitMargin >= 20 ? "from-teal-500 to-teal-600" : profitLoss.profitMargin >= 0 ? "from-amber-500 to-amber-600" : "from-rose-600 to-rose-700"} rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80 text-sm font-medium">Kâr Marjı</span>
                <span className="text-2xl">📊</span>
              </div>
              <div className="text-2xl font-bold">
                %{profitLoss.profitMargin.toFixed(1)}
              </div>
              <div className="text-white/80 text-xs mt-1">{profitLoss.profitMargin >= 20 ? "İyi" : profitLoss.profitMargin >= 0 ? "Düşük" : "Zarar"}</div>
            </div>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl w-fit mb-6 w-full">
          <button
            onClick={() => setActiveReportTab("charts")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${activeReportTab === "charts"
              ? "bg-white text-gray-900 shadow-md"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            📊 Grafikler
          </button>
          <button
            onClick={() => setActiveReportTab("list")}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${activeReportTab === "list"
              ? "bg-white text-gray-900 shadow-md"
              : "text-gray-600 hover:text-gray-900"
              }`}
          >
            📋 Satış Listesi
          </button>
        </div>
        {activeReportTab === "charts" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Profit Trend Chart */}
            {range !== "daily" && profitTrendData.length > 0 && (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard title="Kâr/Zarar Trend" icon="📊" subtitle={selectedCategory === "Tümü" ? "Günlük gelir, maliyet ve kâr" : `${selectedCategory} - Kâr/Zarar`}>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={profitTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          type="number"
                          scale="time"
                          domain={["dataMin", "dataMax"]}
                          tickFormatter={(ts) => format(new Date(ts), "dd/MM")}
                          interval="preserveStartEnd"
                          minTickGap={10}
                        />
                        <YAxis
                          tickFormatter={(value) =>
                            `₺${value.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                          }
                        />
                        <RechartsTooltip
                          labelFormatter={(ts) => format(new Date(ts), "dd/MM/yyyy")}
                          formatter={(value: number, name: string) => [
                            `₺${value.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
                            name === "revenue" ? "Ciro" : name === "cost" ? "Maliyet" : "Kâr",
                          ]}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={true} name="revenue" />
                        <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} dot={true} name="cost" />
                        <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2.5} dot={true} name="profit" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            )}

            {/* Category Profit Table */}
            <div className="col-span-1 lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    🏷️ Kategori Bazlı Kâr Analizi
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  {categoryProfitData.length > 0 ? (
                    <table className="min-w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Kategori</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Ciro</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Maliyet</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Kâr</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Marj</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Adet</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {categoryProfitData.map((cat) => (
                          <tr key={cat.category} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-gray-900">{cat.category}</td>
                            <td className="px-6 py-3 text-right text-gray-700">
                              ₺{cat.revenue.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-3 text-right text-gray-700">
                              ₺{cat.cost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className={`px-6 py-3 text-right font-bold ${cat.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                              ₺{cat.profit.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-3 text-center">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cat.margin >= 20 ? "bg-green-100 text-green-700" :
                                cat.margin >= 0 ? "bg-amber-100 text-amber-700" :
                                  "bg-red-100 text-red-700"
                                }`}>
                                %{cat.margin.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-center text-gray-700">{cat.units.toLocaleString("tr-TR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      Seçilen aralıkta satış verisi yok
                    </div>
                  )}
                </div>
              </div>
            </div>

            {range !== "daily" ? (
              <div className="col-span-1 lg:col-span-2">
                <ChartCard title="Satış Trendleri" icon="📈" subtitle={selectedCategory === "Tümü" ? "Günlük satış grafiği" : `${selectedCategory} - Günlük`}>
                  {filteredSales.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={(() => {
                            const dailyTotals: { date: number; total: number }[] =
                              Array.from(
                                filteredSales.reduce((acc, sale: Sale) => {
                                  if (sale.paymentMethod === "family") return acc;

                                  const d: Date = new Date(
                                    sale.timestamp.seconds * 1000
                                  );
                                  const dayStart: Date = new Date(
                                    d.getFullYear(),
                                    d.getMonth(),
                                    d.getDate()
                                  );
                                  const key: number = dayStart.getTime();
                                  const prev: number = acc.get(key) ?? 0;

                                  // Calculate sale total based on category filter
                                  let saleTotal: number = 0;
                                  if (selectedCategory === "Tümü") {
                                    saleTotal = sale.total;
                                  } else {
                                    sale.items.forEach((item) => {
                                      if (item.category === selectedCategory) {
                                        saleTotal += (item.price || 0) * item.qty;
                                      }
                                    });
                                  }

                                  if (saleTotal > 0) {
                                    acc.set(key, prev + saleTotal);
                                  }
                                  return acc;
                                }, new Map<number, number>())
                              )
                                .sort((a, b) => a[0] - b[0])
                                .map(([ts, total]: [number, number]) => ({
                                  date: ts,
                                  total,
                                }));

                            return dailyTotals;
                          })()}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            type="number"
                            scale="time"
                            domain={["dataMin", "dataMax"]}
                            tickFormatter={(ts) => format(new Date(ts), "dd/MM")}
                            interval="preserveStartEnd"
                            minTickGap={10}
                          />
                          <YAxis />
                          <RechartsTooltip
                            labelFormatter={(ts) =>
                              format(new Date(ts), "dd/MM/yyyy")
                            }
                            formatter={(value: number) => [
                              `₺${value.toFixed(2)}`,
                              "Toplam Satış",
                            ]}
                          />
                          <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={true}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center">
                      <p className="text-gray-500 text-lg font-semibold">
                        Seçilen aralıkta satış yok
                      </p>
                    </div>
                  )}
                </ChartCard>
              </div>
            ) : (
              <></>
            )}

            {/* Hourly Sales Chart */}
            <div className="col-span-1 lg:col-span-2">
              <ChartCard title="Saatlik Satış Hareketliliği" icon="⏰" subtitle="Saat bazlı satış dağılımı">
                {filteredSales.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hourlySalesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="label"
                          stroke="#6b7280"
                          style={{ fontSize: "12px" }}
                          interval={1}
                        />
                        <YAxis
                          stroke="#6b7280"
                          style={{ fontSize: "12px" }}
                          tickFormatter={(value) =>
                            `₺${value.toLocaleString("tr-TR", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}`
                          }
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                          }}
                          formatter={(value: number) => [
                            `₺${value.toLocaleString("tr-TR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`,
                            "Satış",
                          ]}
                          labelFormatter={(label) => `Saat: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{
                            fill: "#3b82f6",
                            strokeWidth: 2,
                            r: 4,
                            stroke: "#fff",
                          }}
                          activeDot={{
                            r: 6,
                            fill: "#2563eb",
                            stroke: "#fff",
                            strokeWidth: 2,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-gray-500 text-lg font-semibold">
                      Seçilen aralıkta satış yok
                    </p>
                  </div>
                )}
              </ChartCard>
              {/* Category Stats Section */}
              <div className="mt-8">
                <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      🏪 Kategori Bazlı Analiz
                      <span className="text-sm font-normal text-gray-500">({selectedCategory})</span>
                    </h2>
                  </div>

                  {/* Category KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Category Sales */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-blue-100 text-sm font-medium">
                          Kategori Satış
                        </span>
                        <span className="text-2xl">💰</span>
                      </div>
                      <div className="text-3xl font-bold">
                        ₺{categoryKPIs.categorySales.toLocaleString("tr-TR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </div>

                    {/* Units Sold */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-100 text-sm font-medium">
                          Satılan Adet
                        </span>
                        <span className="text-2xl">📦</span>
                      </div>
                      <div className="text-3xl font-bold">
                        {categoryKPIs.categoryUnits.toLocaleString("tr-TR")}
                      </div>
                      <div className="text-green-100 text-xs mt-1">Ürün adedi</div>
                    </div>

                    {/* Number of Transactions */}
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-100 text-sm font-medium">
                          İşlem Sayısı
                        </span>
                        <span className="text-2xl">🧾</span>
                      </div>
                      <div className="text-3xl font-bold">
                        {categoryKPIs.categoryTransactions.toLocaleString("tr-TR")}
                      </div>
                      <div className="text-purple-100 text-xs mt-1">Toplam işlem</div>
                    </div>

                    {/* Average Transaction */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-5 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-orange-100 text-sm font-medium">
                          Ortalama İşlem
                        </span>
                        <span className="text-2xl">📊</span>
                      </div>
                      <div className="text-3xl font-bold">
                        ₺{categoryKPIs.avgTransaction.toLocaleString("tr-TR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </div>
                      <div className="text-orange-100 text-xs mt-1">İşlem başına</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Top Selling Products */}
            <div className="col-span-1 lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    🏆 En Çok Satılan Ürünler (Top 10)
                  </h2>
                </div>
                <div className="p-6">
                  {topProducts.length > 0 ? (
                    <div className="space-y-4">
                      {topProducts.map((product, index) => (
                        <div
                          key={product.name}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group relative overflow-hidden"
                        >
                          {/* Progress Bar Background */}
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-blue-100 opacity-0 group-hover:opacity-20 transition-opacity"
                            style={{
                              width: `${(product.qty / topProducts[0].qty) * 100}%`,
                            }}
                          />

                          <div className="flex items-center gap-4 z-10">
                            <div
                              className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${index === 0
                                ? "bg-yellow-400 text-yellow-900"
                                : index === 1
                                  ? "bg-gray-300 text-gray-800"
                                  : index === 2
                                    ? "bg-orange-300 text-orange-900"
                                    : "bg-blue-100 text-blue-600"
                                }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {product.qty.toLocaleString("tr-TR")} adet satıldı
                              </p>
                            </div>
                          </div>
                          <div className="text-right z-10">
                            <div className="font-bold text-gray-800">
                              ₺
                              {product.revenue.toLocaleString("tr-TR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-xs text-gray-500">Toplam Ciro</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-500">
                      Bu kategoride satış bulunamadı.
                    </div>
                  )}
                </div>
              </div>
            </div>
            <ChartCard title="Ödeme Yöntemleri Dağılımı" icon="💳" subtitle="Ödeme türlerine göre">
              {categoryData.labels.length > 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <div style={{ width: "300px", height: "300px" }}>
                    <Pie
                      data={paymentData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "right",
                            labels: {
                              usePointStyle: true,
                              padding: 20,
                            },
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                const value: number = context.raw as number;
                                const total: number = (
                                  context.dataset.data as number[]
                                ).reduce((a, b) => a + b, 0);
                                const percentage: string = (
                                  (value / total) *
                                  100
                                ).toFixed(1);
                                return `${context.label}: ₺${value.toLocaleString()} (${percentage}%)`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 text-lg font-semibold">
                    Seçilen aralıkta satış yok
                  </p>
                </div>
              )}
            </ChartCard>
            <ChartCard title="Kategori Bazlı Satışlar" icon="📦" subtitle="Ürün kategorilerine göre">
              {categoryData.labels.length > 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <div style={{ width: "300px", height: "300px" }}>
                    <Pie
                      data={categoryData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: "right",
                            labels: {
                              usePointStyle: true,
                              padding: 20,
                            },
                          },
                          tooltip: {
                            callbacks: {
                              label: function (context) {
                                const value: number = context.raw as number;
                                const total: number = (
                                  context.dataset.data as number[]
                                ).reduce((a, b) => a + b, 0);
                                const percentage: string = (
                                  (value / total) *
                                  100
                                ).toFixed(1);
                                return `${context.label}: ₺${value.toLocaleString()} (${percentage}%)`;
                              },
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 text-lg font-semibold">
                    Seçilen aralıkta satış yok
                  </p>
                </div>
              )}
            </ChartCard>
          </div>
        )}
        {activeReportTab === "list" && (
          <SalesTable filteredSales={filteredSales} />
        )}
      </div>
      {showChat && <ChatInterface onClose={() => setShowChat(false)} />}
    </div>
  );
}
