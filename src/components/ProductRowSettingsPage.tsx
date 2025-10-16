import { useEffect, useState } from "react";
import type { CartItem } from "../types/Product";
import { toast } from "react-toastify";
import { db } from "../lib/firebase";
import { collection, getDocs, query } from "firebase/firestore";

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
  const [editQty, setEditQty] = useState<number>(product.qty);
  const [editCategory, setEditCategory] = useState<string>(product.category);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (isEditing) {
      getDocs(query(collection(db, "products"))).then((docs) => {
        setCategories(
          Array.from(new Set(docs.docs.map((doc) => doc.data().category) ?? []))
        );
      });
    }
  }, [isEditing]);

  const handleSave: () => void = () => {
    onUpdate(product.barcode, "name", editName);
    onUpdate(product.barcode, "price", editPrice);
    onUpdate(product.barcode, "qty", editQty);
    onUpdate(product.barcode, "category", editCategory);
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
            value={editQty}
            onChange={(e) => setEditQty(Number(e.target.value))}
          />
        ) : (
          <span>{product.qty}</span>
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
