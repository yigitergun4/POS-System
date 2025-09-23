import Navbar from "../components/Navbar";
import { useState } from "react";
import { products } from "../lib/products";

export default function SettingsPage() {
  const [activeProducts, setActiveProducts] = useState(
    products.reduce(
      (acc, p) => {
        acc[p.id] = true; // tüm ürünler başta aktif
        return acc;
      },
      {} as Record<number, boolean>
    )
  );

  const toggleProduct = (id: number) => {
    setActiveProducts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar pageTitle="Ayarlar" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Genel Ayarlar */}
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3">🌍 Genel Ayarlar</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Dil</span>
              <select className="border rounded-lg px-2 py-1 text-sm">
                <option>Türkçe</option>
                <option>English</option>
              </select>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Para Birimi</span>
              <select className="border rounded-lg px-2 py-1 text-sm">
                <option>₺ TL</option>
                <option>$ USD</option>
                <option>€ EUR</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stok Ayarları */}
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3">📦 Stok Ayarları</h2>
          <div className="space-y-3">
            <label className="flex justify-between items-center text-sm">
              <span>Kritik stok (Bisküvi)</span>
              <input
                type="number"
                defaultValue={10}
                className="border rounded-lg px-2 py-1 w-20"
              />
            </label>
            <label className="flex justify-between items-center text-sm">
              <span>Kritik stok (Bira)</span>
              <input
                type="number"
                defaultValue={24}
                className="border rounded-lg px-2 py-1 w-20"
              />
            </label>
            <label className="flex justify-between items-center text-sm">
              <span>Kritik stok (Çikolata)</span>
              <input
                type="number"
                defaultValue={15}
                className="border rounded-lg px-2 py-1 w-20"
              />
            </label>
          </div>
        </div>

        {/* Ürün Yönetimi */}
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3">🛒 Ürün Yönetimi</h2>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-200">
            {products.slice(0, 10).map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center py-2 text-sm"
              >
                <span className="text-gray-700">{p.name}</span>
                <button
                  onClick={() => toggleProduct(p.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    activeProducts[p.id]
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {activeProducts[p.id] ? "Aktif" : "Pasif"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
