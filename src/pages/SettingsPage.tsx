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
import BulkPriceModal from "../components/BulkPriceModal";
import { toast } from "react-toastify";

type ActiveTab = "general" | "products";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("general");
  const [productList, setProductList] = useState<CartItem[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState<boolean>(false);
  const [newProduct, setNewProduct] = useState<CartItem>({
    id: "",
    name: "",
    price: 0,
    cost: 0,
    supplier: "",
    qty: 0,
    barcode: "",
    category: "Diğer",
    threshold: 0,
  });
  const [currency, setCurrency] = useState<string>("TL");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsubscribe: () => void = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const data: CartItem[] = snapshot.docs.map(
          (doc) => doc.data() as CartItem
        );
        setProductList(data);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCurrency: () => Promise<void> = async () => {
      const generalRef = doc(db, "settings", "general");
      const snapshot = await getDoc(generalRef);
      if (snapshot.exists()) {
        setCurrency((snapshot.data() as { currency: string }).currency);
      }
    };
    fetchCurrency();
  }, []);

  const handleAddProduct: () => Promise<void> = async () => {
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

  const handleCloseModal: () => void = () => {
    setShowAddModal(false);
    setNewProduct({
      id: "",
      name: "",
      price: 0,
      cost: 0,
      supplier: "",
      qty: 0,
      barcode: "",
      category: "Diğer",
      threshold: 0,
    });
  };

  const handleDeleteProduct: (id: string) => Promise<void> = async (
    id: string
  ) => {
    await deleteDoc(doc(db, "products", id));
    toast.success("Ürün silindi ✅");
  };

  const handleUpdateProduct: (
    id: string,
    field: keyof CartItem,
    value: string | number
  ) => Promise<void> = async (
    id: string,
    field: keyof CartItem,
    value: string | number
  ) => {
      await updateDoc(doc(db, "products", id), { [field]: value });
    };

  const saveCurrency: () => Promise<void> = async () => {
    const generalRef = doc(db, "settings", "general");
    await setDoc(generalRef, { currency });
    toast.success("Para birimi kaydedildi ✅");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar pageTitle="Ayarlar" />
      <div className="flex space-x-4 p-6 border-b bg-white">
        <button
          onClick={() => setActiveTab("general")}
          className={`px-4 py-2 rounded-lg ${activeTab === "general" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
        >
          ⚙️ Genel Ayarlar
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 rounded-lg ${activeTab === "products" ? "bg-blue-500 text-white" : "bg-gray-100"
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
      {activeTab === "products" && (
        <div className="p-6 bg-white shadow-md rounded-xl border border-gray-200 max-h-[calc(100vh-12rem)] overflow-y-auto m-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
              >
                ➕ Ürün Ekle
              </button>
              <button
                onClick={() => setShowBulkPriceModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
              >
                📊 Toplu Fiyat Güncelle
              </button>
            </div>
            <span className="text-sm text-gray-600">
              Toplam <span className="font-bold">{productList.length}</span>{" "}
              ürün
            </span>
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
      {showBulkPriceModal && (
        <BulkPriceModal
          products={productList}
          onClose={() => setShowBulkPriceModal(false)}
          onDone={() => setShowBulkPriceModal(false)}
        />
      )}
    </div>
  );
}
