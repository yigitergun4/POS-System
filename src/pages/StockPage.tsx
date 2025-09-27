import Navbar from "../components/Navbar";
import { products } from "../lib/products";
import { useState, useMemo, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// 🔑 Firestore key mapping
const categoryKeyMap: Record<string, string> = {
  Bira: "bira",
  Çikolata: "cikolata",
  İçecek: "icecek",
  "Ağır Alkol": "agiralkol",
  Kuruyemişler: "kuruyemisler",
  Diğer: "diger",
};

export default function StockPage() {
  const [stock] = useState(products);
  const [stockThresholds, setStockThresholds] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);

  const categories: string[] = Array.from(
    new Set(stock.map((p) => p.category))
  );

  // 🔹 Firestore'dan kritik stok değerlerini çek
  useEffect(() => {
    const fetchStockLevels = async () => {
      try {
        setLoading(true);

        const stockRef = doc(db, "settings", "stockLevels");
        const snapshot = await getDoc(stockRef);

        if (snapshot.exists()) {
          const data = snapshot.data() as Record<string, number>;
          setStockThresholds(data);
        } else {
          // Varsayılan değerleri yaz
          const defaultThresholds: Record<string, number> = {
            bira: 24,
            cikolata: 15,
            icecek: 20,
            agiralkol: 12,
            kuruyemisler: 8,
            diger: 5,
          };
          await setDoc(stockRef, defaultThresholds);
          setStockThresholds(defaultThresholds);
        }
      } catch (err) {
        console.error("❌ Stok eşikleri yüklenemedi:", err);
        setStockThresholds({
          biskuvi: 20,
          bira: 24,
          cikolata: 15,
          icecek: 20,
          agiralkol: 12,
          kuruyemisler: 8,
          diger: 5,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStockLevels();
  }, []);

  // 🔹 Ürünleri kategoriye göre gruplandır + kritik stoklara göre sırala
  const groupedStock: Record<string, typeof stock> = useMemo(() => {
    if (loading || Object.keys(stockThresholds).length === 0) {
      return {};
    }

    const groups: Record<string, typeof stock> = {};
    categories.forEach((cat) => {
      const key = categoryKeyMap[cat] || cat.toLowerCase();
      const threshold: number = stockThresholds[key] ?? 0;

      groups[cat] = stock
        .filter((p) => p.category === cat)
        .sort((a, b) => {
          const aLow = a.qty <= threshold ? 1 : 0;
          const bLow = b.qty <= threshold ? 1 : 0;
          if (aLow !== bLow) return bLow - aLow;
          return a.qty - b.qty;
        });
    });
    return groups;
  }, [stock, stockThresholds, categories, loading]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <Navbar pageTitle="Stok" />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Stok verileri yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Navbar pageTitle="Stok" />
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        <h1 className="text-2xl font-semibold mb-6 text-gray-800">
          Stok Takibi
        </h1>
        <div className="flex-1 overflow-auto space-y-8 pr-2">
          {categories.map((cat) => {
            const key = categoryKeyMap[cat] || cat.toLowerCase();
            const threshold = stockThresholds[key] ?? 0;

            const criticalCount =
              groupedStock[cat]?.filter((item) => item.qty <= threshold)
                .length || 0;

            return (
              <div
                key={cat}
                className="bg-white rounded-2xl shadow border border-gray-200"
              >
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-100 rounded-t-2xl flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">{cat}</h2>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">
                      Kritik eşik: {threshold}
                    </span>
                    <br />
                    <span className="text-lg text-red-600 font-bold">
                      {criticalCount} Kritik Stok
                    </span>
                  </div>
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
                      {groupedStock[cat]?.map((item) => {
                        const isLow = item.qty <= threshold;
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
