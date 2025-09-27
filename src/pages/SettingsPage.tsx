import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  getDoc,
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

  // 🔹 Firestore stockLevels ile aynı key'ler
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

  // 🔹 Ürünleri çek
  useEffect(() => {
    const fetchProducts = async (): Promise<void> => {
      const snapshot = await getDocs(collection(db, "products"));
      const data = snapshot.docs.map((doc) => ({
        ...(doc.data() as CartItem),
      }));
      setProductList(data);
    };
    fetchProducts();
  }, []);

  // 🔹 Firestore'dan stok seviyelerini çek
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

  const handleAddProduct = async (): Promise<void> => {
    if (!newProduct.name || !newProduct.barcode) {
      alert("Ürün adı ve barkod gerekli!");
      return;
    }
    const id: string = newProduct.barcode;
    await setDoc(doc(db, "products", id), { ...newProduct, id });
    setProductList((prev) => [...prev, { ...newProduct, id: Number(id) }]);
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

  const handleDeleteProduct: (id: string) => Promise<void> = async (id) => {
    await deleteDoc(doc(db, "products", id));
    setProductList((prev) => prev.filter((p) => p.barcode !== id));
  };

  const handleUpdateProduct = async (
    id: string,
    field: keyof CartItem,
    value: string | number
  ) => {
    setProductList((prev) =>
      prev.map((p) => (p.barcode === id ? { ...p, [field]: value } : p))
    );
    await updateDoc(doc(db, "products", id), { [field]: value });
  };

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
          🌍 Genel Ayarlar
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
      {activeTab === "stock" && (
        <div className="p-6 bg-white shadow-md rounded-xl border border-gray-200 m-6">
          <h2 className="text-lg font-semibold mb-4">📦 Stok Ayarları</h2>
          <p className="text-sm text-gray-600 mb-6">
            Buradan kategori bazlı kritik stok seviyelerini belirleyebilirsiniz.
            Stok bu seviyenin altına düştüğünde sistem sizi uyaracaktır.
          </p>
          <div className="space-y-4">
            {Object.entries(stockLevels).map(([key, value]) => (
              <label
                key={key}
                className="flex justify-between items-center text-sm"
              >
                <span className="capitalize">{key}</span>
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
            <input
              type="text"
              placeholder="Barkod veya ürün adı ara..."
              className="border px-3 py-2 rounded-lg text-sm w-72"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
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
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
