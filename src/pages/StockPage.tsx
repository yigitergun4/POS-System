import Navbar from "../components/Navbar";
import { products } from "../lib/products";
import { useState, useMemo } from "react";

export default function StockPage() {
  const [stock] = useState(products);
  const categories: string[] = Array.from(
    new Set(stock.map((p) => p.category))
  );

  const stockThresholds: Record<string, number> = {
    Yiyecek: 10,
    İçecek: 10,
    Bira: 24,
    "Ağır Alkol": 6,
    Kuruyemişler: 8,
    Diğer: 5,
  };

  const groupedStock: Record<string, typeof stock> = useMemo(() => {
    const groups: Record<string, typeof stock> = {};
    categories.forEach((cat) => {
      groups[cat] = stock
        .filter((p) => p.category === cat)
        .sort((a, b) => {
          const aLow = a.qty <= stockThresholds[cat] ? 1 : 0;
          const bLow = b.qty <= stockThresholds[cat] ? 1 : 0;

          if (aLow !== bLow) return bLow - aLow;
          return a.qty - b.qty;
        });
    });
    return groups;
  }, [stock]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Navbar pageTitle="Stok" />
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">
          Stok Takibi
        </h1>
        <div className="flex-1 overflow-auto space-y-8 pr-2">
          {categories.map((cat) => (
            <div
              key={cat}
              className="bg-white rounded-2xl shadow border border-gray-200"
            >
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-100 rounded-t-2xl flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">{cat}</h2>
                <span className="text-lg text-red-600 font-bold">
                  {
                    groupedStock[cat].filter(
                      (item) => item.qty <= stockThresholds[cat]
                    ).length
                  }{" "}
                  Kritik Stok
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-300 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Ürün Adı
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Fiyat
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Mevcut Stok
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700">
                        Durum
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedStock[cat].map((item) => {
                      const isLow = item.qty <= stockThresholds[cat];
                      return (
                        <tr
                          key={item.id}
                          className={`border-b last:border-none ${
                            isLow ? "bg-red-100" : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 py-3">{item.name}</td>
                          <td className="px-4 py-3">{item.price} ₺</td>
                          <td className="px-4 py-3">{item.qty}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                isLow
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {isLow ? "Düşük Stok" : "Yeterli"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
