import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import SalesPageTotalSide from "../components/SalesPageTotalSide";
import useBarcodeScanner from "../hooks/useBarcodeScanner";
import QuantityInput from "../components/QuantityInput";
import CartItemControls from "../components/CardItemsControls";
import ProductGrid from "../components/ProductsGrid";
import { db } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { type CartItem } from "../types/Product";

export default function SalesPage() {
  const [allProducts, setAllProducts] = useState<CartItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [qty, setQty] = useState<number>(1);
  const [lastProduct, setLastProduct] = useState<CartItem | null>(null);
  const [tab, setTab] = useState<"barcode" | "manual">("barcode");

  // 🔹 Firestore'dan ürünleri gerçek zamanlı dinle
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...(doc.data() as CartItem),
      }));
      setAllProducts(data);
    });

    return () => unsubscribe();
  }, []);

  const handleClearCart = () => {
    setCart([]);
    setLastProduct(null);
    setQty(1);
  };

  const handleCashPayment = async () => {
    alert("Nakit Ödeme");
  };

  const handleCardPayment = async () => {
    alert("Kart ile ödeme");
  };

  // 🔹 Barkod okutma
  useBarcodeScanner((code) => {
    if (tab !== "barcode") return;
    const product = allProducts.find((p) => p.barcode === code);
    if (!product) {
      console.log("Ürün bulunamadı: " + code);
      return;
    }

    const addedProduct: CartItem = { ...product, qty };
    setLastProduct(addedProduct);

    setCart((prev) => {
      const exists = prev.find((item) => item.barcode === product.barcode);
      if (exists) {
        return prev.map((item) =>
          item.barcode === product.barcode
            ? { ...item, qty: item.qty + qty }
            : item
        );
      }
      return [...prev, addedProduct];
    });

    setQty(1);
  });

  const handleSelectProduct = (product: CartItem) => {
    setLastProduct(product);
    setCart((prev) => {
      const exists = prev.find((item) => item.barcode === product.barcode);
      if (exists) {
        return prev.map((item) =>
          item.barcode === product.barcode
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const total: number = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Navbar pageTitle="Satış" />
      <div className="flex flex-1">
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab("barcode")}
              className={`px-4 py-2 rounded-lg font-medium ${
                tab === "barcode"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Barkod
            </button>
            <button
              onClick={() => setTab("manual")}
              className={`px-4 py-2 rounded-lg font-medium ${
                tab === "manual"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Ürün Seç
            </button>
          </div>
          {tab === "barcode" && (
            <>
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
                      <p className="text-sm font-semibold text-blue-600 mt-1">
                        Ara Toplam: {lastProduct.price * lastProduct.qty} ₺
                      </p>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-gray-400">
                      Henüz okutulmadı
                    </p>
                  )}
                </div>
                <QuantityInput qty={qty} setQty={setQty} />
              </div>
              <div className="flex-1 bg-white rounded-2xl shadow-md border border-gray-200 overflow-y-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 border-b border-gray-300 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 font-semibold text-gray-700">
                        Ürün Adı
                      </th>
                      <th className="px-4 py-2 font-semibold text-gray-700">
                        Adet
                      </th>
                      <th className="px-4 py-2 font-semibold text-gray-700">
                        Fiyat
                      </th>
                      <th className="px-4 py-2 font-semibold text-gray-700">
                        Ara Toplam
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr
                        key={item.barcode}
                        className="border-b last:border-none hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">
                          <CartItemControls
                            qty={item.qty}
                            onIncrease={() =>
                              setCart((prev) =>
                                prev.map((p) =>
                                  p.barcode === item.barcode
                                    ? { ...p, qty: p.qty + 1 }
                                    : p
                                )
                              )
                            }
                            onDecrease={() =>
                              setCart((prev) =>
                                prev.map((p) =>
                                  p.barcode === item.barcode
                                    ? { ...p, qty: Math.max(p.qty - 1, 1) }
                                    : p
                                )
                              )
                            }
                            onRemove={() =>
                              setCart((prev) =>
                                prev.filter((p) => p.barcode !== item.barcode)
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-3">{item.price} ₺</td>
                        <td className="px-4 py-3 font-medium">
                          {item.price * item.qty} ₺
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
            </>
          )}
          {tab === "manual" && (
            <div className="flex-1 overflow-auto">
              <ProductGrid
                products={allProducts}
                onSelect={handleSelectProduct}
              />
            </div>
          )}
        </div>
        <SalesPageTotalSide
          total={total}
          onCashPayment={handleCashPayment}
          onCardPayment={handleCardPayment}
          onClearCart={handleClearCart}
        />
      </div>
    </div>
  );
}
