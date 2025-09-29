import { useRef, useEffect } from "react";
import type { CartItem } from "../types/Product";

type Props = {
  newProduct: CartItem;
  setNewProduct: (p: CartItem) => void;
  onSave: () => void;
  onClose: () => void;
};

export default function AddProductModalSettingsPage({
  newProduct,
  setNewProduct,
  onSave,
  onClose,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 shadow-lg space-y-4">
        <h3 className="text-lg font-semibold mb-3">➕ Yeni Ürün Ekle</h3>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Ürün Adı</label>
          <input
            ref={inputRef}
            placeholder="Örn: Eti Cin"
            className="border rounded-lg px-2 py-2 w-full"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Barkod</label>
          <input
            placeholder="8690..."
            className="border rounded-lg px-2 py-2 w-full"
            value={newProduct.barcode}
            onChange={(e) =>
              setNewProduct({ ...newProduct, barcode: e.target.value })
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              💰 Fiyat (₺)
            </label>
            <input
              type="number"
              inputMode="numeric"
              className="border rounded-lg px-2 py-2 w-full text-right"
              value={newProduct.price}
              onInput={(e) => {
                const rawValue: string = (e.target as HTMLInputElement).value;
                const cleaned: string = rawValue.replace(/[^0-9.,]/g, "");
                const normalized: string = cleaned.replace(",", ".");
                setNewProduct({
                  ...newProduct,
                  price: parseFloat(normalized) || 0,
                });
              }}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              📦 Stok Adedi
            </label>
            <input
              type="number"
              inputMode="numeric"
              className="border rounded-lg px-2 py-2 w-full text-right"
              value={newProduct.qty}
              onInput={(e) => {
                const value = (e.target as HTMLInputElement).value.replace(
                  /\D/g,
                  ""
                );
                setNewProduct({ ...newProduct, qty: Number(value) || 0 });
              }}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Kategori</label>
          <select
            className="border rounded-lg px-2 py-2 w-full"
            value={newProduct.category}
            onChange={(e) =>
              setNewProduct({ ...newProduct, category: e.target.value })
            }
          >
            <option>Yiyecek</option>
            <option>İçecek</option>
            <option>Bira</option>
            <option>Ağır Alkol</option>
            <option>Kuruyemişler</option>
            <option>Diğer</option>
            <option>Sigara</option>
          </select>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 text-sm"
          >
            İptal
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm"
          >
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
