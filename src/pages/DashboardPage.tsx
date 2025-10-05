import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import SummaryCard from "../components/SummaryCardDashboardPage";
import ChartCard from "../components/ChartCardDashboardPage";
import DatePicker from "react-datepicker";
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

ChartJS.register(ArcElement, Tooltip, Legend);

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
      let totalSales = 0;
      let cashSales = 0;
      let cardSales = 0;
      let familySales = 0;

      filteredSales.forEach((s) => {
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
            ) : (
              <></>
            )}
            <ChartCard title="Ödeme Yöntemleri Dağılımı">
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
    </div>
  );
}
