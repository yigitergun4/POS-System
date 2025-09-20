import { useState } from "react";
import Navbar from "../components/Navbar";
import SalesPageTotalSide from "../components/SalesPageTotalSide";
import useBarcodeScanner from "../hooks/useBarcodeScanner";
import QuantityInput from "../components/QuantityInput";

type CartItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
  barcode: string;
};

export default function SalesPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [qty, setQty] = useState<number>(1);
  const [lastProduct, setLastProduct] = useState<CartItem | null>(null);

  const products: CartItem[] = [
    { id: 1, name: "Kola 330ml", price: 25, qty: 10, barcode: "123456" },
    { id: 2, name: "Cips", price: 30, qty: 10, barcode: "789012" },
    { id: 3, name: "Çikolata", price: 15, qty: 10, barcode: "345678" },
    { id: 4, name: "Eti Cin", price: 7.5, qty: 10, barcode: "86900478" },
  ];

  // listen to barcode
  useBarcodeScanner((code) => {
    const product: CartItem | undefined = products.find((p) => p.barcode === code);
    if (!product) {
      console.log("Ürün bulunamadı: " + code);
      return;
    }

    // update last product
    const addedProduct: CartItem = { ...product, qty };
    setLastProduct(addedProduct);

    // add to basket
    setCart((prev: CartItem[]) => {
      const exists: CartItem | undefined = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.map((item: CartItem) =>
          item.id === product.id ? { ...item, qty: item.qty + qty } : item
        );
      }
      return [...prev, addedProduct];
      setQty(1);
    });

    setQty(1);
  });

  const total: number = cart.reduce((sum: number, item: CartItem) => sum + item.price * item.qty, 0);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Navbar pageTitle="Satış" />
      <div className="flex flex-1">
        <div className="flex-1 p-6 flex flex-col">
          <div className="mb-4 flex items-center justify-between bg-white border border-gray-200 rounded-xl shadow p-4">
            <div>
              <p className="text-sm text-gray-500">Son Ürün</p>
              {lastProduct ? (
                <div>
                  <p className="text-lg font-bold text-gray-800">
                    {lastProduct.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {lastProduct.price} ₺ × {lastProduct.qty} adet
                  </p>
                  <p className="text-sm font-semibold text-gray-700 mt-1">
                    Ara Toplam: {lastProduct.price * lastProduct.qty} ₺
                  </p>
                </div>
              ) : (
                <p className="text-lg font-bold text-gray-400">
                  Henüz okutulmadı
                </p>
              )}
            </div>
            <div>
              <QuantityInput qty={qty} setQty={setQty} />
            </div>
          </div>
          <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-200 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Ürün Adı
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Adet</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Fiyat
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700">
                    Ara Toplam
                  </th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item: CartItem) => (
                  <tr key={item.id} className="border-b last:border-none">
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.qty}</td>
                    <td className="px-4 py-3">{item.price} ₺</td>
                    <td className="px-4 py-3 font-medium">
                      {item.price * item.qty} ₺
                      <button className="px-4 py-3">Artır</button>
                      <button className="px-4 py-3">Azalt</button>
                    </td>
                  </tr>
                ))}
                {cart.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center text-gray-400 py-8 text-lg"
                    >
                      Henüz ürün eklenmedi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <SalesPageTotalSide
          total={total}
          onCashPayment={() => alert("Nakit ödeme")}
          onCardPayment={() => alert("Kart ile ödeme")}
        />
      </div>
    </div>
  );
}
