import Navbar from "../components/Navbar";
import { useState, useEffect, useRef } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { CartItem } from "../types/Product";
import ProductTableSettingsPage from "../components/ProductTableSettingsPage";
import AddProductModalSettingsPage from "../components/AddProductModalSettingsPage";
import { toast } from "react-toastify";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"general" | "stock" | "products">(
    "general"
  );
  const [productList, setProductList] = useState<CartItem[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newProduct, setNewProduct] = useState<CartItem>({
    id: 0,
    name: "",
    price: 0,
    qty: 0,
    barcode: "",
    category: "Diğer",
  });
  const [currency, setCurrency] = useState<string>("TL");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [stockLevels, setStockLevels] = useState<{
    bira: number;
    cikolata: number;
    icecek: number;
    agiralkol: number;
    kuruyemisler: number;
    diger: number;
  }>({
    bira: 24,
    cikolata: 15,
    icecek: 20,
    agiralkol: 12,
    kuruyemisler: 8,
    diger: 5,
  });

  // 🔹 Ürünler için canlı dinleme
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data() as CartItem);
      setProductList(data);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Stok seviyeleri
  useEffect(() => {
    const fetchStockLevels = async () => {
      const stockRef = doc(db, "settings", "stockLevels");
      const snapshot = await getDoc(stockRef);
      if (snapshot.exists()) {
        setStockLevels(snapshot.data() as typeof stockLevels);
      }
    };
    fetchStockLevels();
  }, []);

  // 🔹 Para birimi
  useEffect(() => {
    const fetchCurrency = async () => {
      const generalRef = doc(db, "settings", "general");
      const snapshot = await getDoc(generalRef);
      if (snapshot.exists()) {
        setCurrency((snapshot.data() as { currency: string }).currency);
      }
    };
    fetchCurrency();
  }, []);

  // 🔹 Yeni ürün ekleme
  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.barcode.trim()) {
      toast.error("Ürün adı ve barkod zorunludur!");
      return;
    }
    if (newProduct.price <= 0) {
      toast.error("Fiyat 0'dan büyük olmalı!");
      return;
    }
    if (newProduct.qty < 0) {
      toast.error("Stok negatif olamaz!");
      return;
    }

    const id: string = newProduct.barcode;
    const productRef: DocumentReference = doc(db, "products", id);
    const existing = await getDoc(productRef);

    if (existing.exists()) {
      toast.error("Bu barkod ile zaten bir ürün mevcut!");
      return;
    }

    await setDoc(productRef, { ...newProduct, id });
    toast.success(`${newProduct.name} başarıyla eklendi ✅`);
    handleCloseModal();
  };

  // 🔹 Modal kapatma
  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewProduct({
      id: 0,
      name: "",
      price: 0,
      qty: 0,
      barcode: "",
      category: "Diğer",
    });
  };

  // 🔹 Ürün silme
  const handleDeleteProduct = async (id: string) => {
    await deleteDoc(doc(db, "products", id));
    toast.success("Ürün silindi ✅");
  };

  // 🔹 Ürün güncelleme
  const handleUpdateProduct = async (
    id: string,
    field: keyof CartItem,
    value: string | number
  ) => {
    await updateDoc(doc(db, "products", id), { [field]: value });
    toast.success("Ürün güncellendi ✅");
  };

  // 🔹 Stok işlemleri
  const updateStock = (key: keyof typeof stockLevels, value: number) => {
    setStockLevels((prev) => ({ ...prev, [key]: value }));
  };

  const resetStockLevels = () => {
    setStockLevels({
      bira: 24,
      cikolata: 15,
      icecek: 20,
      agiralkol: 12,
      kuruyemisler: 8,
      diger: 5,
    });
  };

  const saveStockLevels = async () => {
    const stockRef = doc(db, "settings", "stockLevels");
    await setDoc(stockRef, stockLevels);
    toast.success("Stok seviyeleri kaydedildi ✅");
  };

  // 🔹 Para birimi kaydetme
  const saveCurrency = async () => {
    const generalRef = doc(db, "settings", "general");
    await setDoc(generalRef, { currency });
    toast.success("Para birimi kaydedildi ✅");
  };

  const STOCK_LABELS: Record<string, string> = {
    bira: "🍺 Bira",
    cikolata: "🍫 Çikolata",
    icecek: "🥤 İçecek",
    agiralkol: "🥃 Ağır Alkol",
    kuruyemisler: "🥜 Kuruyemişler",
    diger: "📦 Diğer",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar pageTitle="Ayarlar" />
      <div className="flex space-x-4 p-6 border-b bg-white">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 rounded-lg ${
            activeTab === "general" ? "bg-blue-500 text-white" : "bg-gray-100"
          }`}
        >
          ⚙️ Genel Ayarlar
        </button>
        <button
          onClick={() => setActiveTab("stock")}
          className={`px-4 py-2 rounded-lg ${
            activeTab === "stock" ? "bg-blue-500 text-white" : "bg-gray-100"
          }`}
        >
          📦 Stok Ayarları
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 rounded-lg ${
            activeTab === "products" ? "bg-blue-500 text-white" : "bg-gray-100"
          }`}
        >
          🛒 Ürün Yönetimi
        </button>
      </div>
      {activeTab === "general" && (
        <div className="p-6 bg-white shadow-md rounded-xl border border-gray-200 m-6">
          <h2 className="text-lg font-semibold mb-4">
            ⚙️ Genel Uygulama Ayarları
          </h2>
          <label className="flex justify-between items-center text-sm">
            <span>Para Birimi</span>
            <select
              className="border rounded-lg px-2 py-1 text-sm"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="TL">₺ TL</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </label>
          <div className="flex justify-end mt-6">
            <button
              onClick={saveCurrency}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"
            >
              Kaydet
            </button>
          </div>
        </div>
      )}
      {activeTab === "stock" && (
        <div className="p-6 bg-white shadow-md rounded-xl border border-gray-200 m-6">
          <h2 className="text-lg font-semibold mb-4">📦 Stok Ayarları</h2>
          <p className="text-sm text-gray-600 mb-6">
            Buradan kategori bazlı kritik stok seviyelerini belirleyebilirsiniz.
          </p>
          <div className="space-y-4">
            {Object.entries(stockLevels).map(([key, value]) => (
              <label
                key={key}
                className="flex justify-between items-center text-sm"
              >
                <span>{STOCK_LABELS[key] || key}</span>
                <input
                  type="number"
                  min={0}
                  className={`border rounded-lg px-2 py-1 w-24 text-right ${
                    value <= 5
                      ? "border-red-500 text-red-600 font-semibold"
                      : "border-gray-300"
                  }`}
                  value={value}
                  onChange={(e) =>
                    updateStock(
                      key as keyof typeof stockLevels,
                      Number(e.target.value)
                    )
                  }
                />
              </label>
            ))}
          </div>
          <div className="flex justify-end mt-6 space-x-2">
            <button
              onClick={resetStockLevels}
              className="px-4 py-2 rounded-lg bg-gray-200 text-sm"
            >
              Sıfırla
            </button>
            <button
              onClick={saveStockLevels}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"
            >
              Kaydet
            </button>
          </div>
        </div>
      )}
      {activeTab === "products" && (
        <div className="p-6 bg-white shadow-md rounded-xl border border-gray-200 overflow-y-auto max-h-[585px] m-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
            >
              ➕ Ürün Ekle
            </button>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-2 rounded-lg text-sm font-medium shadow"
                onClick={() => {
                  setFilterText("");
                  inputRef.current?.focus();
                }}
              >
                X
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder="Barkod veya ürün adı ara..."
                className="border px-3 py-2 rounded-lg text-sm w-72"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>
          <ProductTableSettingsPage
            products={productList}
            filterText={filterText}
            onUpdate={handleUpdateProduct}
            onDelete={handleDeleteProduct}
          />
        </div>
      )}
      {showAddModal && (
        <AddProductModalSettingsPage
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          onSave={handleAddProduct}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
