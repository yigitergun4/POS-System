import Navbar from "../components/Navbar";
import { useState, useMemo, useEffect } from "react";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { CartItem } from "../types/Product";

// Deprecated: category-level thresholds removed; keep map here only if needed elsewhere

export default function StockPage() {
  const [stock, setStock] = useState<CartItem[]>([]);
  const [stockThresholds, setStockThresholds] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState<boolean>(true);
  const [filterText, setFilterText] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const data: CartItem[] = snapshot.docs.map((doc) => ({
        ...(doc.data() as Omit<CartItem, "id">),
        id: doc.id,
      }));
      setStock(data);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchStockLevels: () => Promise<void> = async () => {
      try {
        setLoading(true);

        const stockRef = doc(db, "settings", "stockLevels");
        const snapshot = await getDoc(stockRef);

        if (snapshot.exists()) {
          const data = snapshot.data() as Record<string, number>;
          setStockThresholds(data);
        } else {
          const defaultThresholds: Record<string, number> = {};
          await setDoc(stockRef, defaultThresholds);
          setStockThresholds(defaultThresholds);
        }
      } catch (err) {
        console.error("❌ Stok eşikleri yüklenemedi:", err);
        setStockThresholds({});
      } finally {
        setLoading(false);
      }
    };

    fetchStockLevels();
  }, []);

  const groupedStock: Record<string, CartItem[]> = useMemo(() => {
    if (loading || stock.length === 0) {
      return {};
    }
    const lower: string = filterText.trim().toLowerCase();
    const filtered: CartItem[] = lower
      ? stock.filter(
          (p) =>
            p.name.toLowerCase().includes(lower) || p.barcode.includes(lower)
        )
      : stock;

    const categories: string[] = Array.from(
      new Set(filtered.map((p) => p.category))
    );
    const groups: Record<string, CartItem[]> = {};

    categories.forEach((cat) => {
      groups[cat] = filtered
        .filter((p) => p.category === cat)
        .sort((a, b) => {
          const aThreshold = stockThresholds[a.barcode] ?? a.threshold ?? 0;
          const bThreshold = stockThresholds[b.barcode] ?? b.threshold ?? 0;
          const aLow = a.qty <= aThreshold ? 1 : 0;
          const bLow = b.qty <= bThreshold ? 1 : 0;
          if (aLow !== bLow) return bLow - aLow;
          return a.qty - b.qty;
        });
    });
    return groups;
  }, [stock, stockThresholds, loading, filterText]);

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

  const categories: string[] = Object.keys(groupedStock);

  const clearFilter: () => void = () => {
    setFilterText("");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Navbar pageTitle="Stok" />
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 p-2">
            <input
              type="text"
              placeholder="Barkod veya ürün adı ara..."
              className="border px-3 py-2 rounded-lg text-sm w-72"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            {filterText && (
              <button
                type="button"
                onClick={clearFilter}
                className="px-3 py-2 rounded-lg bg-gray-200 text-sm"
              >
                Temizle
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto space-y-8 pr-2">
          {categories.map((cat) => {
            const criticalCount: number =
              groupedStock[cat]?.filter((item) => {
                const itemThreshold =
                  stockThresholds[item.barcode] ?? item.threshold ?? 0;
                return item.qty <= itemThreshold;
              }).length || 0;

            return (
              <div
                key={cat}
                className="bg-white rounded-2xl shadow border border-gray-200"
              >
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-100 rounded-t-2xl flex justify-between items-center">
                  <h2 className="text-lg font-bold text-gray-800">{cat}</h2>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">
                      Kritik eşikler ürün bazlı
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
                        const itemThreshold =
                          stockThresholds[item.barcode] ?? item.threshold ?? 0;
                        const isLow = item.qty <= itemThreshold;
                        return (
                          <tr
                            key={item.barcode}
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
          {categories.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              Sonuç bulunamadı
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
