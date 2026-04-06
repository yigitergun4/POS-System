import React, { useState, useEffect, useMemo } from "react";
import { collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Campaign } from "../types/Campaign";
import type { CartItem } from "../types/Product";
import { toast } from "react-toastify";
import { useConfirmation } from "../contexts/ConfirmationContext";

export default function CampaignsSettingsTab(): React.ReactElement {
  const { confirm } = useConfirmation();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newCampaign, setNewCampaign] = useState<Partial<Campaign>>({
    name: "",
    isActive: true,
    targetType: "category",
    targetCategory: "",
    targetBarcodes: [],
    conditionPaymentMethod: "card",
    effectType: "add_fee_per_item",
    effectValue: 0,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  useEffect(() => {
    const unsubC = onSnapshot(collection(db, "campaigns"), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data() as Campaign);
      setCampaigns(data);
    });

    const unsubP = onSnapshot(collection(db, "products"), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data() as CartItem);
      setProducts(data);
    });

    return () => { unsubC(); unsubP(); };
  }, []);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    const s = productSearch.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(s) || p.barcode.toLowerCase().includes(s)
    ).slice(0, 5);
  }, [products, productSearch]);

  const toggleProductSelection = (barcode: string) => {
    setNewCampaign(prev => {
      const barcodes = prev.targetBarcodes || [];
      if (barcodes.includes(barcode)) {
        return { ...prev, targetBarcodes: barcodes.filter(b => b !== barcode) };
      }
      return { ...prev, targetBarcodes: [...barcodes, barcode] };
    });
  };

  // handleCancelEdit handles resetting the campaign form to its default state.
  // We use a regular function or a const without strict event typing to allow it to be called
  // both as an event handler (with 1 arg) and manually (with 0 args).
  const handleCancelEdit = () => {
    setEditingId(null);
    setNewCampaign({
      name: "",
      isActive: true,
      targetType: "category",
      targetCategory: "",
      targetBarcodes: [],
      conditionPaymentMethod: "card",
      effectType: "add_fee_per_item",
      effectValue: 0,
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    });
    setProductSearch("");
  };

  const handleAddCampaign = async () => {
    if (!newCampaign.name?.trim()) {
      toast.error("Kampanya adı zorunludur!");
      return;
    }

    if (newCampaign.targetType === "category" && !newCampaign.targetCategory?.trim()) {
      toast.error("Hedef kategori zorunludur!");
      return;
    }

    if (newCampaign.targetType === "products" && (!newCampaign.targetBarcodes || newCampaign.targetBarcodes.length === 0)) {
      toast.error("En az bir ürün seçilmelidir!");
      return;
    }

    const id = editingId || Date.now().toString();
    const campaignToAdd: Campaign = {
      id,
      name: newCampaign.name!,
      isActive: newCampaign.isActive ?? true,
      targetType: newCampaign.targetType as any,
      targetCategory: newCampaign.targetCategory || "",
      targetBarcodes: newCampaign.targetBarcodes || [],
      conditionPaymentMethod: newCampaign.conditionPaymentMethod as any,
      effectType: newCampaign.effectType as any,
      effectValue: Number(newCampaign.effectValue),
      startDate: newCampaign.startDate || "",
      endDate: newCampaign.endDate || "",
    };

    try {
      await setDoc(doc(db, "campaigns", id), campaignToAdd);
      toast.success(editingId ? "Kampanya güncellendi ✨" : "Kampanya eklendi ✅");
      handleCancelEdit();
    } catch (err) {
      toast.error("Hata oluştu!");
    }
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setNewCampaign({
      name: campaign.name,
      isActive: campaign.isActive,
      targetType: campaign.targetType,
      targetCategory: campaign.targetCategory,
      targetBarcodes: campaign.targetBarcodes,
      conditionPaymentMethod: campaign.conditionPaymentMethod,
      effectType: campaign.effectType,
      effectValue: campaign.effectValue,
      startDate: campaign.startDate || "",
      endDate: campaign.endDate || "",
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleToggleActive = async (campaign: Campaign) => {
    try {
      await setDoc(doc(db, "campaigns", campaign.id), {
        ...campaign,
        isActive: !campaign.isActive,
      });
      toast.success(`${campaign.name} durumu güncellendi`);
    } catch (err) {
      toast.error("Güncellenirken hata oluştu!");
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Kampanya Sil",
      message: `"${name}" kampanyasını silmek istediğinize emin misiniz?`,
      type: "danger",
      confirmText: "Sil",
      cancelText: "Vazgeç",
    });
    if (!ok) return;

    try {
      await deleteDoc(doc(db, "campaigns", id));
      toast.success("Kampanya silindi 🗑️");
    } catch (err) {
      toast.error("Silinirken hata oluştu!");
    }
  };

  return (
    <div className="m-6 space-y-4 select-none">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 rounded-xl px-6 py-6 shadow-xl text-white transform transition-all hover:scale-[1.005]">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">🎁</div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Kampanya ve Fiyatlandırma Yönetimi
            </h2>
            <p className="text-white/80 text-sm mt-0.5">
              Dinamik kurallar ile karlılığınızı ve satış stratejinizi yönetin.
            </p>
          </div>
        </div>
      </div>

      {/* Campaign Form Card */}
      <div className="bg-white shadow-md rounded-xl border border-gray-200 p-6 transition-all">
        <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <span className="text-indigo-500">{editingId ? "📝" : "✨"}</span>
          <span>{editingId ? "Kampanyayı Düzenle" : "Yeni Kampanya Oluştur"}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase transition-colors group-focus-within:text-indigo-600">Kampanya Adı</label>
            <input
              type="text"
              placeholder="Örn: Hafta Sonu Fırsatı"
              className="border-2 border-gray-100 rounded-xl px-3 py-2.5 w-full text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all placeholder:text-gray-300"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
            />
          </div>
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase transition-colors group-focus-within:text-indigo-600">Başlangıç Tarihi</label>
            <input
              type="date"
              className="border-2 border-gray-100 rounded-xl px-3 py-2.5 w-full text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all cursor-pointer"
              value={newCampaign.startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setNewCampaign({ ...newCampaign, startDate: e.target.value })}
            />
          </div>
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase transition-colors group-focus-within:text-indigo-600">Bitiş Tarihi</label>
            <input
              type="date"
              className="border-2 border-gray-100 rounded-xl px-3 py-2.5 w-full text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all cursor-pointer"
              value={newCampaign.endDate}
              onChange={(e) => setNewCampaign({ ...newCampaign, endDate: e.target.value })}
            />
          </div>
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase transition-colors group-focus-within:text-indigo-600">Hedef Grubu</label>
            <select
              className="border-2 border-gray-100 rounded-xl px-3 py-2.5 w-full text-sm bg-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all cursor-pointer appearance-none"
              value={newCampaign.targetType}
              onChange={(e) => setNewCampaign({ ...newCampaign, targetType: e.target.value as any })}
            >
              <option value="category">📂 Kategori Bazlı</option>
              <option value="products">🛍️ Seçili Ürünler</option>
            </select>
          </div>
          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase transition-colors group-focus-within:text-indigo-600">Ödeme Koşulu</label>
            <select
              className="border-2 border-gray-100 rounded-xl px-3 py-2.5 w-full text-sm bg-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all cursor-pointer appearance-none"
              value={newCampaign.conditionPaymentMethod}
              onChange={(e) => setNewCampaign({ ...newCampaign, conditionPaymentMethod: e.target.value as any })}
            >
              <option value="ALL">🌐 Tüm Yöntemler</option>
              <option value="cash">💵 Sadece Nakit</option>
              <option value="card">💳 Sadece Kart</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {newCampaign.targetType === "category" ? (
            <div className="group">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase transition-colors group-focus-within:text-indigo-600">Uygulanacak Kategori</label>
              <input
                type="text"
                placeholder="Örn: Bira, Cips, Kola..."
                className="border-2 border-gray-100 rounded-xl px-3 py-2.5 w-full text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all"
                value={newCampaign.targetCategory}
                onChange={(e) => setNewCampaign({ ...newCampaign, targetCategory: e.target.value })}
              />
            </div>
          ) : (
            <div className="relative group">
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase transition-colors group-focus-within:text-indigo-600">Ürün Ara ve Ekle</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Barkod veya isim yazın..."
                  className="border-2 border-gray-100 rounded-xl px-3 py-2.5 w-full text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all pl-9"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
              </div>

              {/* Selected Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2 min-h-[1.5rem]">
                {newCampaign.targetBarcodes?.map(b => {
                  const p = products.find(prod => prod.barcode === b);
                  return (
                    <span key={b} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border border-indigo-100 animate-in fade-in zoom-in duration-200">
                      {p?.name || b}
                      <button
                        onClick={() => toggleProductSelection(b)}
                        className="hover:bg-indigo-200 rounded-full w-4 h-4 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>

              {/* Search Results Dropdown */}
              {filteredProducts.length > 0 && (
                <div className="absolute z-20 w-full bg-white border-2 border-indigo-100 rounded-xl shadow-2xl overflow-hidden mt-1 animate-in slide-in-from-top-2 duration-200">
                  {filteredProducts.map(p => {
                    const isSelected = newCampaign.targetBarcodes?.includes(p.barcode);
                    return (
                      <button
                        key={p.barcode}
                        onClick={() => {
                          toggleProductSelection(p.barcode);
                          setProductSearch("");
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors text-sm border-b last:border-none flex justify-between items-center cursor-pointer ${isSelected ? 'bg-indigo-50/50' : ''}`}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-800">{p.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">{p.barcode}</span>
                        </div>
                        {isSelected ? (
                          <span className="bg-indigo-500 text-white p-1 rounded-full text-[10px]">✓</span>
                        ) : (
                          <span className="text-indigo-400 text-xs">Seç +</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="group">
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase transition-colors group-focus-within:text-indigo-600">İşlem & Miktar</label>
            <div className="flex gap-3">
              <select
                className="border-2 border-gray-100 rounded-xl px-3 py-2.5 flex-grow text-sm bg-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all cursor-pointer appearance-none"
                value={newCampaign.effectType}
                onChange={(e) => setNewCampaign({ ...newCampaign, effectType: e.target.value as any })}
              >
                <option value="add_fee_per_item">➕ Adet Başı Ücret Ekle</option>
                <option value="discount_per_item">➖ Adet Başı İndirim</option>
                <option value="percentage_discount">📉 Yüzdelik (%) İndirim</option>
              </select>
              <div className="relative">
                <input
                  type="number"
                  placeholder="0"
                  className="border-2 border-gray-100 rounded-xl px-3 py-2.5 w-24 text-center text-sm font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50/50 transition-all"
                  value={newCampaign.effectValue || ""}
                  onChange={(e) => setNewCampaign({ ...newCampaign, effectValue: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-gray-50 mt-2 gap-3">
          {editingId && (
            <button
              onClick={handleCancelEdit}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-8 py-3 rounded-xl text-sm transition-all active:scale-95 cursor-pointer"
            >
              Vazgeç
            </button>
          )}
          <button
            onClick={handleAddCampaign}
            className={`${editingId ? "bg-amber-500 hover:bg-amber-600 shadow-amber-100" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"} text-white font-bold px-8 py-3 rounded-xl text-sm shadow-lg transition-all active:scale-95 cursor-pointer flex items-center gap-2`}
          >
            {editingId ? "📝 Değişiklikleri Kaydet" : "📂 Kampanyayı Kaydet"}
          </button>
        </div>
      </div>

      {/* Campaigns Table Card */}
      <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden min-h-[400px]">
        <div className="px-6 py-4 border-b bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Yürürlükteki Kurallar</h3>
          <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{campaigns.length} Kural</span>
        </div>

        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-300">
            <span className="text-6xl mb-4">📭</span>
            <p className="text-sm font-medium">Henüz bir kampanya kuralı tanımlanmadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-4 text-center w-24">Durum</th>
                  <th className="px-6 py-4 text-left">Kampanya Açıklaması</th>
                  <th className="px-6 py-4 text-left">Hedef</th>
                  <th className="px-6 py-4 text-center">Detaylar</th>
                  <th className="px-6 py-4 text-center">Geçerlilik</th>
                  <th className="px-6 py-4 text-center w-20">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campaigns.map(c => {
                  const isExpired = c.endDate && c.endDate < new Date().toISOString().split("T")[0];
                  return (
                    <tr key={c.id} className="group hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleActive(c)}
                            className={`w-12 h-6 rounded-full relative transition-all duration-300 cursor-pointer ${c.isActive ? "bg-green-500 shadow-sm shadow-green-200" : "bg-gray-200"}`}
                          >
                            <span className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all duration-300 shadow-md ${c.isActive ? "translate-x-7" : "translate-x-1"}`}></span>
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm ${!c.isActive ? "text-gray-400" : "text-gray-800"}`}>{c.name}</span>
                          {!c.isActive && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">İşlem Dışı</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {c.targetType === "category" ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">Kategori</span>
                            <span className="font-semibold text-gray-700">{c.targetCategory}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[10px] text-indigo-400 uppercase font-bold text-xs">Seçili Ürünler</span>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded w-fit">{c.targetBarcodes?.length} Ürün Seçili</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 uppercase">
                              {c.conditionPaymentMethod === "ALL" ? "Tümü" : c.conditionPaymentMethod === "cash" ? "Nakit" : "Kart"}
                            </span>
                            <span className={`text-sm font-black ${c.effectType === "add_fee_per_item" ? "text-red-500" : "text-green-600"}`}>
                              {c.effectType === "add_fee_per_item" ? "↑" : "↓"}
                              {c.effectValue}{c.effectType === "percentage_discount" ? "%" : " ₺"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {c.startDate ? (
                            <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 rounded">Başlangıç: {c.startDate}</span>
                          ) : (
                            <span className="text-[10px] text-gray-300 italic">Hemen</span>
                          )}
                          {c.endDate ? (
                            <span className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${isExpired ? "bg-red-50 text-red-500 border-red-100" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                              {c.endDate} {isExpired && "⚠️ DOLDU"}
                            </span>
                          ) : (
                            <span className="text-[11px] text-gray-300 font-bold italic">Süresiz</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEditCampaign(c)}
                            className="p-2 text-gray-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                            title="Düzenle"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(c.id, c.name)}
                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                            title="Kuralı Sil"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
