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

  const { totalSales, cashSales, cardSales, familySales, avgBasket } =
    useMemo(() => {
      let totalSales: number = 0;
      let cashSales: number = 0;
      let cardSales: number = 0;
      let familySales: number = 0;

      filteredSales.forEach((s: Sale) => {
        totalSales += s.total;
        if (s.paymentMethod === "cash") cashSales += s.total;
        if (s.paymentMethod === "card") cardSales += s.total;
        if (s.paymentMethod === "family") familySales += s.total;
      });

      const avgBasket: string =
        filteredSales.length > 0
          ? (totalSales / filteredSales.length).toFixed(2)
          : "0";

      return { totalSales, cashSales, cardSales, familySales, avgBasket };
    }, [filteredSales]);
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
            <Listbox value={range} onChange={(val) => setRange(val)}>
              <div className="relative">
                <Listbox.Button className="w-40 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm flex justify-between items-center">
                  {options.find((o) => o.key === range)?.label}
                  <span>▾</span>
                </Listbox.Button>
                <Listbox.Options className="absolute mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {options.map(({ key, label }) => (
                    <Listbox.Option
                      key={key}
                      value={key}
                      className={({ active }) =>
                        `cursor-pointer px-3 py-2 text-sm ${
                          active ? "bg-blue-100 text-blue-700" : "text-gray-700"
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
              <div className="flex items-center gap-2 text-sm">
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
                />
              </div>
            )}
          </div>
        </div>
        


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <SummaryCard
            title="Toplam Satış"
            value={`₺ ${totalSalesWithoutFamily.toLocaleString()}`}
            color="blue"
          />
          <SummaryCard
            title="Nakit Satış"
            value={`₺ ${cashSales.toLocaleString()}`}
            color="green"
          />
          <SummaryCard
            title="Kart Satış"
            value={`₺ ${cardSales.toLocaleString()}`}
            color="purple"
          />
          <SummaryCard
            title="Aile Satış"
            value={`₺ ${familySales.toLocaleString()}`}
            color="red"
          />
          <SummaryCard
            title="Ortalama Sepet"
            value={`₺ ${avgBasket}`}
            color="orange"
          />
        </div>
        <div className="flex space-x-4 border-b mb-6">
          <button
            onClick={() => setActiveReportTab("charts")}
            className={`px-4 py-2 rounded-t-lg ${
              activeReportTab === "charts"
                ? "bg-blue-500 text-white"
                : "bg-gray-100"
            }`}
          >
            📊 Grafikler
          </button>
          <button
            onClick={() => setActiveReportTab("list")}
            className={`px-4 py-2 rounded-t-lg ${
              activeReportTab === "list"
                ? "bg-blue-500 text-white"
                : "bg-gray-100"
            }`}
          >
            📋 Satış Listesi
          </button>
        </div>
        {activeReportTab === "charts" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {range !== "daily" ? (
              <div className="col-span-1 lg:col-span-2">
              <ChartCard title="Satış Trendleri">
                {filteredSales.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={(() => {
                          const nonFamilySales: Sale[] = filteredSales.filter(
                            (s) => s.paymentMethod !== "family"
                          );
                          const dailyTotals: { date: number; total: number }[] =
                            Array.from(
                              nonFamilySales.reduce((acc, sale: Sale) => {
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
                                acc.set(key, prev + sale.total);
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
              <ChartCard title="⏰ Saatlik Satış Hareketliliği">
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
                      {/* Category Filter Section */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                🏪 Kategori Bazlı Analiz
              </h2>
              <Listbox value={selectedCategory} onChange={setSelectedCategory}>
                <div className="relative">
                  <Listbox.Button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 min-w-[180px] justify-between">
                    <span className="font-medium">{selectedCategory}</span>
                    <span>▾</span>
                  </Listbox.Button>
                  <Listbox.Options className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-60 overflow-auto">
                    {categories.map((category) => (
                      <Listbox.Option
                        key={category}
                        value={category}
                        className={({ active }) =>
                          `cursor-pointer px-4 py-3 text-sm transition-colors ${
                            active
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 hover:bg-gray-50"
                          } ${
                            selectedCategory === category
                              ? "font-semibold bg-blue-100"
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
                              className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                                index === 0
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
            <ChartCard title="Ödeme Yöntemleri Dağılımı">
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
            <ChartCard title="Kategori Bazlı Satışlar">
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
