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
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 shadow-lg space-y-4">
        <h3 className="text-lg font-semibold mb-3">➕ Yeni Ürün Ekle</h3>
        <input
          placeholder="Ürün Adı"
          className="border rounded-lg px-2 py-2 w-full"
          value={newProduct.name}
          onChange={(e) =>
            setNewProduct({ ...newProduct, name: e.target.value })
          }
        />
        <input
          placeholder="Barkod"
          className="border rounded-lg px-2 py-2 w-full"
          value={newProduct.barcode}
          onChange={(e) =>
            setNewProduct({ ...newProduct, barcode: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Fiyat"
          className="border rounded-lg px-2 py-2 w-full"
          value={newProduct.price}
          onChange={(e) =>
            setNewProduct({ ...newProduct, price: Number(e.target.value) })
          }
        />
        <input
          type="number"
          placeholder="Stok"
          className="border rounded-lg px-2 py-2 w-full"
          value={newProduct.qty}
          onChange={(e) =>
            setNewProduct({ ...newProduct, qty: Number(e.target.value) })
          }
        />
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
        </select>
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
