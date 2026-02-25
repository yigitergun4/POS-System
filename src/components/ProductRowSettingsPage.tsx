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

const Button: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  className: string;
}> = ({ children, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-xs shadow text-white mr-2 ${className}`}
    >
      {children}
    </button>
  );
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

  const handleSave: () => void = () => {
    onUpdate(product.barcode, "name", editName);
    onUpdate(product.barcode, "price", editPrice);
    onUpdate(product.barcode, "cost", editCost);
    onUpdate(product.barcode, "supplier", editSupplier);
    onUpdate(product.barcode, "qty", editQty);
    onUpdate(product.barcode, "category", editCategory);
    onUpdate(product.barcode, "threshold", editThreshold);
    setIsEditing(false);
    toast.success(`${product.name} ürünü güncellendi.`);
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="border px-3 py-2">
        {isEditing ? (
          <input
            className="w-full border rounded px-2 py-1"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
        ) : (
          <span>{product.name}</span>
        )}
      </td>
      <td className="border px-3 py-2 text-gray-600">{product.barcode}</td>
      <td className="border px-3 py-2 text-center">
        {isEditing ? (
          <input
            type="number"
            className="w-20 border rounded px-2 py-1 text-right"
            value={editPrice}
            onChange={(e) => setEditPrice(Number(e.target.value))}
          />
        ) : (
          <span>{product.price} ₺</span>
        )}
      </td>
      <td className="border px-3 py-2 text-center">
        {isEditing ? (
          <input
            type="number"
            className="w-20 border rounded px-2 py-1 text-right"
            value={editCost}
            onChange={(e) => setEditCost(Number(e.target.value))}
          />
        ) : (
          <span>{product.cost ?? 0} ₺</span>
        )}
      </td>
      <td className="border px-3 py-2 text-center">
        {isEditing ? (
          <select
            className="w-28 border rounded px-2 py-1"
            value={editSupplier}
            onChange={(e) => setEditSupplier(e.target.value)}
          >
            <option value="">Seçiniz...</option>
            {suppliersList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        ) : (
          <span className="text-gray-600">{product.supplier || "-"}</span>
        )}
      </td>
      <td className="border px-3 py-2 text-center">
        {isEditing ? (
          <input
            type="number"
            className="w-20 border rounded px-2 py-1 text-right"
            value={editQty}
            onChange={(e) => setEditQty(Number(e.target.value))}
          />
        ) : (
          <span>{product.qty}</span>
        )}
      </td>
      <td className="border px-3 py-2 text-center">
        {isEditing ? (
          <input
            type="number"
            className="w-20 border rounded px-2 py-1 text-right"
            value={editThreshold}
            min={0}
            onChange={(e) => setEditThreshold(Number(e.target.value))}
          />
        ) : (
          <span>{product.threshold ?? 0}</span>
        )}
      </td>
      <td className="border px-3 py-2 text-center">
        {isEditing ? (
          <select
            className="w-full border rounded px-2 py-1"
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
          <span>{product.category}</span>
        )}
      </td>
      <td className="border px-3 py-2 text-center space-x-2">
        {isEditing ? (
          <Button
            onClick={handleSave}
            className="bg-green-500 hover:bg-green-600"
          >
            Kaydet
          </Button>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Düzenle
          </Button>
        )}
        <Button
          onClick={() => {
            if (
              window.confirm(
                `${product.name} ürününü silmek istediğine emin misin?`
              )
            ) {
              onDelete(product.barcode);
              toast.success(`${product.name} ürünü silindi 🗑️`);
            }
          }}
          className="bg-red-500 hover:bg-red-600"
        >
          Sil
        </Button>
      </td>
    </tr>
  );
}
