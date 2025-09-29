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
ChartJS.register(ArcElement, Tooltip, Legend);

export default function DashboardPage() {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly" | "custom">(
    "daily"
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

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
        ...(doc.data() as Sale),
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
            "#3b82f6", // blue
            "#10b981", // green
            "#f59e0b", // orange
            "#ef4444", // red
            "#8b5cf6", // purple
            "#6b7280", // gray
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

  const todayStart: number = Math.floor(
    startOfDay(new Date()).getTime() / 1000
  );
  const todayEnd: number = Math.floor(endOfDay(new Date()).getTime() / 1000);

  const todaysSales: Sale[] = sales.filter(
    (sale) =>
      sale.timestamp.seconds >= todayStart && sale.timestamp.seconds <= todayEnd
  );

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
            value={`₺ ${totalSales.toLocaleString()}`}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Satış Trendleri">
            {range !== "daily" ? (
              filteredSales.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={Object.values(
                        filteredSales.reduce(
                          (
                            acc: Record<
                              string,
                              { date: string; total: number }
                            >,
                            sale
                          ) => {
                            const dateStr = format(
                              new Date(sale.timestamp.seconds * 1000),
                              "dd/MM/yyyy"
                            );
                            if (!acc[dateStr]) {
                              acc[dateStr] = { date: dateStr, total: 0 };
                            }
                            acc[dateStr].total += sale.total;
                            return acc;
                          },
                          {}
                        )
                      )}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
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
              )
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-gray-400 text-base">
                  📅 Günlük görünümde trend grafiği kapalı
                </p>
              </div>
            )}
          </ChartCard>
          <ChartCard title="Ödeme Yöntemleri Dağılımı">
            {range === "daily" ? (
              todaysSales.length > 0 ? (
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
                            enabled: true,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 text-lg font-semibold">
                    Bugün satış yok
                  </p>
                </div>
              )
            ) : (
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
                          enabled: true,
                        },
                      },
                    }}
                  />
                </div>
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
                  Bugün satış yok
                </p>
              </div>
            )}
          </ChartCard>
          <ChartCard title="En Çok Satan Ürünler">
            {range === "daily" ? (
              todaysSales.length > 0 ? (
                <div className="flex space-x-3 overflow-x-auto pb-2">
                  {Object.entries(
                    filteredSales
                      .flatMap((s) => s.items)
                      .reduce(
                        (acc, item) => {
                          const cat = item.category || "Diğer";
                          if (!acc[cat]) acc[cat] = {};
                          acc[cat][item.name] =
                            (acc[cat][item.name] || 0) + item.qty;
                          return acc;
                        },
                        {} as Record<string, Record<string, number>>
                      )
                  ).map(([category, items]) => (
                    <div
                      key={category}
                      className="min-w-[250px] bg-white border border-gray-400 rounded-lg shadow p-4"
                    >
                      <h3 className="font-semibold text-gray-700 mb-2">
                        {category}
                      </h3>
                      <ul className="divide-y divide-gray-200">
                        {Object.entries(items)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([name, qty]) => (
                            <li
                              key={name}
                              className="flex justify-between py-2 text-sm text-gray-600"
                            >
                              <span>{name}</span>
                              <span className="font-semibold">{qty} adet</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 text-lg font-semibold">
                    Bugün satış yok
                  </p>
                </div>
              )
            ) : (
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {Object.entries(
                  filteredSales
                    .flatMap((s) => s.items)
                    .reduce(
                      (acc, item) => {
                        const cat = item.category || "Diğer";
                        if (!acc[cat]) acc[cat] = {};
                        acc[cat][item.name] =
                          (acc[cat][item.name] || 0) + item.qty;
                        return acc;
                      },
                      {} as Record<string, Record<string, number>>
                    )
                ).map(([category, items]) => (
                  <div
                    key={category}
                    className="min-w-[250px] bg-white border border-gray-400 rounded-lg shadow p-4"
                  >
                    <h3 className="font-semibold text-gray-700 mb-2">
                      {category}
                    </h3>
                    <ul className="divide-y divide-gray-200">
                      {Object.entries(items)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5)
                        .map(([name, qty]) => (
                          <li
                            key={name}
                            className="flex justify-between py-2 text-sm text-gray-600"
                          >
                            <span>{name}</span>
                            <span className="font-semibold">{qty} adet</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
