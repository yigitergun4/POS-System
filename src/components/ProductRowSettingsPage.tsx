import { useEffect, useState } from "react";
import type { CartItem } from "../types/Product";
import { toast } from "react-toastify";
import { db } from "../lib/firebase";
import { collection, getDocs, query, onSnapshot } from "firebase/firestore";

type Props = {
  product: CartItem;
  onUpdate: (id: string, field: keyof CartItem, value: string | number) => void;
  onDelete: (id: string) => void;
};


export default function ProductRowSettingsPage({
  product,
  onUpdate,
  onDelete,
}: Props) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>(product.name);
  const [editPrice, setEditPrice] = useState<number>(product.price);
  const [editCost, setEditCost] = useState<number>(product.cost ?? 0);
  const [editSupplier, setEditSupplier] = useState<string>(product.supplier ?? "");
  const [editQty, setEditQty] = useState<number>(product.qty);
  const [editCategory, setEditCategory] = useState<string>(product.category);
  const [editThreshold, setEditThreshold] = useState<number>(
    product.threshold ?? 0
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliersList, setSuppliersList] = useState<string[]>([]);

  useEffect(() => {
    if (isEditing) {
      getDocs(query(collection(db, "products"))).then((docs) => {
        setCategories(
          Array.from(new Set(docs.docs.map((doc) => doc.data().category) ?? []))
        );
      });
    }
  }, [isEditing]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "suppliers"), (snapshot) => {
      const data: string[] = snapshot.docs
        .map((d) => (d.data() as { name: string }).name)
        .sort((a, b) => a.localeCompare(b, "tr"));
      setSuppliersList(data);
    });
    return () => unsubscribe();
  }, []);

  const margin: number = editPrice > 0 ? ((editPrice - editCost) / editPrice) * 100 : 0;
  const isPriceIncreased: boolean = editPrice !== product.price;
  const isCostUntouched: boolean = editCost === product.cost;

  const handleSave: () => void = () => {
    if (!editCost || editCost <= 0) {
      toast.error("Alış fiyatı zorunludur! (0'dan büyük olmalı)");
      return;
    }

    if (isPriceIncreased && isCostUntouched) {
      toast.info("Satış fiyatı değişti, alış fiyatını kontrol ettiğinizden emin olun.", {
        icon: () => "💡"
      });
    }
    
    onUpdate(product.barcode, "name", editName);
    onUpdate(product.barcode, "price", editPrice);
    onUpdate(product.barcode, "cost", editCost);
    onUpdate(product.barcode, "supplier", editSupplier);
    onUpdate(product.barcode, "qty", editQty);
    onUpdate(product.barcode, "category", editCategory);
    onUpdate(product.barcode, "threshold", editThreshold);
    setIsEditing(false);
    toast.success(`${editName} ürünü güncellendi.`);
  };

  return (
    <tr className="hover:bg-indigo-50/20 transition-colors group">
      <td className="px-6 py-4">
        {isEditing ? (
          <input
            className="w-full border-2 border-gray-100 rounded-lg px-3 py-1.5 text-sm focus:border-indigo-500 outline-none transition-all"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        ) : (
          <div className="flex flex-col">
            <span className="font-bold text-gray-800">{product.name}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{product.category}</span>
          </div>
        )}
      </td>
      <td className="px-6 py-4 font-mono text-[11px] text-gray-400">{product.barcode}</td>
      <td className={`px-6 py-4 text-center ${isEditing && isPriceIncreased ? 'bg-blue-50/30' : ''}`}>
        {isEditing ? (
          <input
            type="number"
            className="w-24 border-2 border-gray-100 rounded-lg px-3 py-1.5 text-right font-bold text-indigo-600 focus:border-indigo-500 outline-none transition-all"
            value={editPrice}
            onChange={(e) => setEditPrice(Number(e.target.value))}
          />
        ) : (
          <span className="font-bold text-gray-700">{product.price.toLocaleString("tr-TR")} ₺</span>
        )}
      </td>
      <td className={`px-6 py-4 text-center transition-colors ${isEditing && isPriceIncreased && isCostUntouched ? 'bg-amber-50 animate-pulse' : ''}`}>
        {isEditing ? (
          <div className="relative group/cost">
            <input
              type="number"
              className={`w-24 border-2 rounded-lg px-3 py-1.5 text-right font-semibold text-gray-600 outline-none transition-all ${isPriceIncreased && isCostUntouched ? 'border-amber-400 ring-4 ring-amber-100 bg-white' : 'border-gray-100 focus:border-indigo-500'}`}
              value={editCost}
              onChange={(e) => setEditCost(Number(e.target.value))}
            />
            {isPriceIncreased && isCostUntouched && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[10px] px-2 py-1 rounded shadow-xl whitespace-nowrap z-20">
                ⚠️ Maliyet kontrolü?
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-500">{(product.cost ?? 0).toLocaleString("tr-TR")} ₺</span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-black shadow-sm ${margin < 15 ? 'bg-red-50 text-red-600' : margin < 30 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
          %{margin.toFixed(1)}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        {isEditing ? (
          <select
            className="w-full border-2 border-gray-100 rounded-lg px-2 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all"
            value={editSupplier}
            onChange={(e) => setEditSupplier(e.target.value)}
          >
            <option value="">Seçiniz...</option>
            {suppliersList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">{product.supplier || "-"}</span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {isEditing ? (
          <input
            type="number"
            className="w-16 border-2 border-gray-100 rounded-lg px-2 py-1.5 text-center text-sm focus:border-indigo-500 outline-none transition-all"
            value={editQty}
            onChange={(e) => setEditQty(Number(e.target.value))}
          />
        ) : (
          <span className={`font-bold ${product.qty <= (product.threshold ?? 0) ? 'text-rose-600 underline decoration-rose-200 underline-offset-4' : 'text-gray-700'}`}>{product.qty}</span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {isEditing ? (
          <input
            type="number"
            className="w-16 border-2 border-gray-100 rounded-lg px-2 py-1.5 text-center text-sm focus:border-indigo-500 outline-none transition-all"
            value={editThreshold}
            min={0}
            onChange={(e) => setEditThreshold(Number(e.target.value))}
          />
        ) : (
          <span className="text-xs font-medium text-gray-400">{product.threshold ?? 0}</span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {isEditing ? (
          <select
            className="w-full border-2 border-gray-100 rounded-lg px-2 py-1.5 text-xs focus:border-indigo-500 outline-none transition-all"
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">
            {product.category}
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-center">
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-md shadow-emerald-100 transition-all active:scale-95"
              title="Kaydet"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 shadow-md shadow-indigo-100 transition-all active:scale-95"
              title="Düzenle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm(`${product.name} ürününü silmek istediğine emin misin?`)) {
                onDelete(product.barcode);
                toast.success(`${product.name} ürünü silindi 🗑️`);
              }
            }}
            className="p-1.5 bg-rose-500 text-white rounded-lg hover:bg-rose-600 shadow-md shadow-rose-100 transition-all active:scale-95"
            title="Sil"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}
