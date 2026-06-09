import Navbar from "../components/Navbar";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  onSnapshot,
  type DocumentReference,
  query,
  orderBy,
  Query,
  type DocumentData,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { CartItem } from "../types/Product";
import ProductTableSettingsPage from "../components/ProductTableSettingsPage";
import AddProductModalSettingsPage from "../components/AddProductModalSettingsPage";
import SupplierPriceModal from "../components/SupplierPriceModal";
import CampaignsSettingsTab from "../components/CampaignsSettingsTab";
import { toast } from "react-toastify";
import { useConfirmation } from "../contexts/ConfirmationContext";
import { DEFAULT_SUPPLIERS } from "../config";
import { toTitleCase } from "../lib/format";
import { logPriceChange } from "../services/priceLogService";
import type { PriceLog } from "../types/services/index";
import { format } from "date-fns";  

type ActiveTab = "general" | "products" | "suppliers" | "campaigns" | "logs";


export default function SettingsPage() {
  const { confirm } = useConfirmation();
  const [activeTab, setActiveTab] = useState<ActiveTab>("general");
  const [productList, setProductList] = useState<CartItem[]>([]);
  const [filterText, setFilterText] = useState<string>("");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showSupplierPriceModal, setShowSupplierPriceModal] = useState<boolean>(false);
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

  // Supplier management
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [newSupplier, setNewSupplier] = useState<string>("");
  const [supplierSearch, setSupplierSearch] = useState<string>("");

  // Product count per supplier
  const supplierProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of productList) {
      const s = p.supplier || "";
      if (s) counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [productList]);

  // Filtered suppliers for search
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter((s) => s.toLowerCase().includes(q));
  }, [suppliers, supplierSearch]);

  // Load products
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

  // Load suppliers (seed defaults if empty)
  useEffect(() => {
    const initSuppliers = async () => {
      const suppliersSnap = await getDocs(collection(db, "suppliers"));
      if (suppliersSnap.empty) {
        for (const name of DEFAULT_SUPPLIERS) {
          await setDoc(doc(db, "suppliers", name), { name });
        }
      }
    };
    initSuppliers();

    const unsubscribe = onSnapshot(collection(db, "suppliers"), (snapshot) => {
      const data: string[] = snapshot.docs
        .map((d) => (d.data() as { name: string }).name)
        .sort((a, b) => a.localeCompare(b, "tr"));
      setSuppliers(data);
    });
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

  // Price logs management
  const [priceLogs, setPriceLogs] = useState<PriceLog[]>([]);
  const [logFilterText, setLogFilterText] = useState<string>("");
  const [logPage, setLogPage] = useState<number>(1);
  const logPageSize:number = 15;

  // Load price logs when logs tab is active
  useEffect(() => {
    if (activeTab !== "logs") return;
    const q: Query<DocumentData> = query(collection(db, "priceLogs"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: PriceLog[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PriceLog[];
      setPriceLogs(data);
    });
    return () => unsubscribe();
  }, [activeTab]);

  const filteredLogs: PriceLog[] = useMemo(() => {
    return priceLogs.filter(log => 
      (log.name || "").toLowerCase().includes(logFilterText.toLowerCase()) ||
      (log.barcode || "").includes(logFilterText)
    ) as PriceLog[];
  }, [priceLogs, logFilterText]);

  const paginatedLogs: PriceLog[] = useMemo(() => {
    const start:number = (logPage - 1) * logPageSize;
    return filteredLogs.slice(start, start + logPageSize) as PriceLog[];
  }, [filteredLogs, logPage]);

  // Reset page when search changes
  useEffect(() => {
    setLogPage(1);
  }, [logFilterText]);

  const formatLogDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return format(date, "dd/MM/yyyy HH:mm");
  };

  const handleAddProduct: () => Promise<void> = async () => {
    if (!newProduct.name.trim() || !newProduct.barcode.trim()) {
      toast.error("Ürün adı ve barkod zorunludur!");
      return;
    }
    if (!newProduct.cost || newProduct.cost <= 0) {
      toast.error("Alış fiyatı zorunludur! (0'dan büyük olmalı)");
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

    const capitalizedProduct = {
      ...newProduct,
      id,
      name: toTitleCase(newProduct.name)
    };

    await setDoc(productRef, capitalizedProduct);
    await logPriceChange({
      barcode: capitalizedProduct.barcode,
      name: capitalizedProduct.name,
      oldPrice: 0,
      newPrice: capitalizedProduct.price,
      oldCost: 0,
      newCost: capitalizedProduct.cost ?? 0,
      source: "add_product",
      details: "Yeni ürün eklendi"
    });
    toast.success(`${capitalizedProduct.name} başarıyla eklendi ✅`);
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
    let finalValue: string | number = value;
    if (field === "name" && typeof value === "string") {
      finalValue = toTitleCase(value);
    }

    const oldProduct: CartItem | undefined = productList.find((p) => p.id === id);
    if (oldProduct && (field === "price" || field === "cost")) {
      const numValue: number = Number(value);
      const oldPrice: number = oldProduct.price;
      const oldCost: number = oldProduct.cost || 0;
      let newPrice: number = oldPrice;
      let newCost: number = oldCost;
      let hasChanged: boolean = false;

      if (field === "price" && numValue !== oldPrice) {
        newPrice = numValue;
        hasChanged = true;
      } else if (field === "cost" && numValue !== oldCost) {
        newCost = numValue;
        hasChanged = true;
      }

      if (hasChanged) {
        await logPriceChange({
          barcode: oldProduct.barcode,
          name: oldProduct.name,
          oldPrice: oldPrice,
          newPrice: newPrice,
          oldCost: oldCost,
          newCost: newCost,
          source: "update_product",
          details: `Manuel düzenleme (${field === "price" ? "Satış Fiyatı" : "Alış Fiyatı"})`
        });
      }
    }

    await updateDoc(doc(db, "products", id), { [field]: finalValue });
  };

  const saveCurrency: () => Promise<void> = async () => {
    const generalRef = doc(db, "settings", "general");
    await setDoc(generalRef, { currency });
    toast.success("Para birimi kaydedildi ✅");
  };
  const handleAddSupplier: () => Promise<void> = async () => {
    const name: string = newSupplier.trim();
    if (!name) {
      toast.error("Toptancı adı boş olamaz!");
      return;
    }
    if (suppliers.includes(name)) {
      toast.error("Bu toptancı zaten mevcut!");
      return;
    }
    await setDoc(doc(db, "suppliers", name), { name });
    toast.success(`${name} eklendi ✅`);
    setNewSupplier("");
  };

  const handleDeleteSupplier: (name: string) => Promise<void> = async (name: string) => {
    const productCount: number = supplierProductCounts[name] || 0;
    const message: string = productCount > 0
      ? `"${name}" toptancısını silmek istediğinize emin misiniz? Bu toptancıya ait ${productCount} ürün var.`
      : `"${name}" toptancısını silmek istediğinize emin misiniz?`;
    const ok: boolean = await confirm({
      title: "Toptancı Sil",
      message,
      type: "danger",
      confirmText: "Sil",
      cancelText: "Vazgeç",
    });
    if (!ok) return;
    await deleteDoc(doc(db, "suppliers", name));
    toast.success(`${name} silindi 🗑️`);
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
        <button
          onClick={() => setActiveTab("suppliers")}
          className={`px-4 py-2 rounded-lg ${activeTab === "suppliers" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
        >
          🏪 Toptancılar
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`px-4 py-2 rounded-lg ${activeTab === "campaigns" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
        >
          🎁 Kampanyalar
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 rounded-lg ${activeTab === "logs" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
        >
          📜 Fiyat Günlükleri
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
                onClick={() => setShowSupplierPriceModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow"
              >
                📊 Toptancı Bazlı Zam
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

      {activeTab === "suppliers" && (
        <div className="m-6 space-y-4">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl px-6 py-5 shadow-lg">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🏪 Toptancı Yönetimi
            </h2>
            <p className="text-indigo-200 text-sm mt-1">
              Toplam <span className="font-bold text-white">{suppliers.length}</span> toptancı kayıtlı
            </p>
          </div>

          {/* Add + Search Row */}
          <div className="bg-white shadow-md rounded-xl border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Add Supplier */}
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  placeholder="Yeni toptancı adı..."
                  className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm flex-1 focus:border-indigo-500 outline-none transition-all"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSupplier()}
                />
                <button
                  onClick={handleAddSupplier}
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all"
                >
                  ➕ Ekle
                </button>
              </div>
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Toptancı ara..."
                  className="border-2 border-gray-200 rounded-xl px-4 py-2.5 pl-9 text-sm w-full sm:w-56 focus:border-indigo-500 outline-none transition-all"
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
              </div>
            </div>
          </div>

          {/* Supplier Grid */}
          <div className="bg-white shadow-md rounded-xl border border-gray-200 p-5">
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <span className="text-3xl block mb-2">🔍</span>
                <p className="text-sm">Toptancı bulunamadı</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredSuppliers.map((s: string) => {
                  const count: number = supplierProductCounts[s] || 0;
                  return (
                    <div
                      key={s}
                      className="group relative flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-gray-800 truncate block">{s}</span>
                        <span className="text-xs text-gray-500">
                          {count > 0 ? `${count} ürün` : "Ürün yok"}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteSupplier(s)}
                        className="ml-2 w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-white hover:bg-red-500 text-xs opacity-0 group-hover:opacity-100 transition-all"
                        title="Sil"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "campaigns" && (
        <CampaignsSettingsTab />
      )}

      {activeTab === "logs" && (
        <div className="p-6 bg-white shadow-md rounded-xl border border-gray-200 m-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                📜 Fiyat Değişim Günlükleri
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Ürünlerin alış ve satış fiyatlarındaki tüm değişimlerin geçmişi
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Ürün adı veya barkod ara..."
                value={logFilterText}
                onChange={(e) => setLogFilterText(e.target.value)}
                className="border px-3 py-2 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {logFilterText && (
                <button
                  onClick={() => setLogFilterText("")}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                >
                  Temizle
                </button>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 font-semibold text-gray-600 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left">Tarih</th>
                    <th className="px-6 py-3.5 text-left">Barkod</th>
                    <th className="px-6 py-3.5 text-left">Ürün Adı</th>
                    <th className="px-6 py-3.5 text-center">İşlem Tipi</th>
                    <th className="px-6 py-3.5 text-right">Alış Fiyatı (Maliyet)</th>
                    <th className="px-6 py-3.5 text-right">Satış Fiyatı</th>
                    <th className="px-6 py-3.5 text-left">Detay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((log) => {
                      const costChanged = log.oldCost !== log.newCost;
                      const priceChanged = log.oldPrice !== log.newPrice;
                      
                      const sourceBadgeColors: Record<string, string> = {
                        add_product: "bg-green-50 text-green-700 border border-green-250",
                        update_product: "bg-blue-50 text-blue-700 border border-blue-250",
                        supplier_adjustment: "bg-purple-50 text-purple-700 border border-purple-250"
                      };

                      const sourceLabels: Record<string, string> = {
                        add_product: "Yeni Ürün",
                        update_product: "Manuel Düzenleme",
                        supplier_adjustment: "Toptancı Zammı"
                      };

                      return (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                            {formatLogDate(log.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono text-xs">
                            {log.barcode}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                            {log.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${sourceBadgeColors[log.source] || "bg-gray-100 text-gray-700"}`}>
                              {sourceLabels[log.source] || log.source}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                            {costChanged ? (
                              <span className="flex items-center justify-end gap-1.5">
                                <span className="text-gray-400 line-through">₺{log.oldCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                                <span className="text-gray-800 font-bold">➔ ₺{log.newCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                              </span>
                            ) : (
                              <span className="text-gray-500">₺{log.newCost.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                            {priceChanged ? (
                              <span className="flex items-center justify-end gap-1.5">
                                <span className="text-gray-400 line-through">₺{log.oldPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                                <span className="text-gray-800 font-bold">➔ ₺{log.newPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                              </span>
                            ) : (
                              <span className="text-gray-500">₺{log.newPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {log.details || "-"}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-400">
                        <span className="text-3xl block mb-2">📜</span>
                        <p className="text-sm font-medium">Herhangi bir fiyat günlük kaydı bulunamadı</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {filteredLogs.length > logPageSize && (
            <div className="flex items-center justify-between mt-6 bg-gray-50 px-4 py-3 rounded-lg border border-gray-150">
              <span className="text-xs text-gray-500">
                Toplam <span className="font-semibold text-gray-700">{filteredLogs.length}</span> kayıttan {" "}
                <span className="font-semibold text-gray-700">{Math.min(filteredLogs.length, (logPage - 1) * logPageSize + 1)}</span>-
                <span className="font-semibold text-gray-700">{Math.min(filteredLogs.length, logPage * logPageSize)}</span> arası gösteriliyor
              </span>
              <div className="flex gap-2">
                <button
                  disabled={logPage === 1}
                  onClick={() => setLogPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
                >
                  ◀ Geri
                </button>
                <button
                  disabled={logPage * logPageSize >= filteredLogs.length}
                  onClick={() => setLogPage(p => p + 1)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition"
                >
                  İleri ▶
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <AddProductModalSettingsPage
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          onSave={handleAddProduct}
          onClose={handleCloseModal}
          suppliers={suppliers}
        />
      )}
      {showSupplierPriceModal && (
        <SupplierPriceModal
          products={productList}
          suppliers={suppliers}
          onClose={() => setShowSupplierPriceModal(false)}
          onDone={() => setShowSupplierPriceModal(false)}
        />
      )}
    </div>
  );
}
