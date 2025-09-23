import { useState } from "react";
import Navbar from "../components/Navbar";
import SummaryCard from "../components/SummaryCardDashboardPage";
import ChartCard from "../components/ChartCardDashboardPage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Listbox } from "@headlessui/react";

export default function DashboardPage() {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly" | "custom">(
    "daily"
  );
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const options = [
    { key: "daily", label: "📅 Günlük" },
    { key: "weekly", label: "📆 Haftalık" },
    { key: "monthly", label: "🗓️ Aylık" },
    { key: "custom", label: "🎯 Özel" },
  ];

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

        {/* Özet Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard title="Toplam Satış" value="₺ 25,430" color="blue" />
          <SummaryCard title="Nakit Satış" value="₺ 12,100" color="green" />
          <SummaryCard title="Kart Satış" value="₺ 13,330" color="purple" />
          <SummaryCard title="Ortalama Sepet" value="₺ 145" color="orange" />
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Satış Trendleri">
            <div className="h-64 flex items-center justify-center text-gray-400">
              📈 {range === "daily" && "Günlük Grafik"}
              {range === "weekly" && "Haftalık Grafik"}
              {range === "monthly" && "Aylık Grafik"}
              {range === "custom" &&
                `Özel Aralık (${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()})`}
            </div>
          </ChartCard>

          <ChartCard title="Kategori Bazlı Satışlar">
            <div className="h-64 flex items-center justify-center text-gray-400">
              🥧 {range} için pasta grafik
            </div>
          </ChartCard>

          <ChartCard title="Ödeme Yöntemleri Dağılımı">
            <div className="h-64 flex items-center justify-center text-gray-400">
              💳 {range} için ödeme dağılımı
            </div>
          </ChartCard>

          <ChartCard title="En Çok Satılan Ürünler">
            <ul className="divide-y divide-gray-200">
              <li className="flex justify-between py-3">
                <span>Eti Cin Siyah</span>
                <span className="font-semibold">320 adet</span>
              </li>
              <li className="flex justify-between py-3">
                <span>Efes Kutu</span>
                <span className="font-semibold">210 adet</span>
              </li>
              <li className="flex justify-between py-3">
                <span>Vivident Storming</span>
                <span className="font-semibold">180 adet</span>
              </li>
            </ul>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
