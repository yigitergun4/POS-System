import { useState } from "react";
import type { CartItem } from "../types/Product";
import { toast } from "react-toastify";

type Props = {
  product: CartItem;
  onUpdate: (id: string, field: keyof CartItem, value: string | number) => void;
  onDelete: (id: string) => void;
};

const Button = ({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={`bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs shadow ${className} mr-2`}
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
  const [isEditing, setIsEditing] = useState(false);

  return (
    <tr className="hover:bg-gray-50">
      <td className="border px-3 py-2">
        {isEditing ? (
          <input
            className="w-full border rounded px-2 py-1"
            value={product.name}
            onChange={(e) => onUpdate(product.barcode, "name", e.target.value)}
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
            value={product.price}
            onChange={(e) =>
              onUpdate(product.barcode, "price", Number(e.target.value))
            }
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
            value={product.qty}
            onChange={(e) =>
              onUpdate(product.barcode, "qty", Number(e.target.value))
            }
          />
        ) : (
          <span>{product.qty}</span>
        )}
      </td>
      <td className="border px-3 py-2 text-center">{product.category}</td>
      <td className="border px-3 py-2 text-center space-x-2">
        {isEditing ? (
          <Button
            onClick={() => {
              setIsEditing(false);
              toast.success(`${product.name} ürünü güncellendi`);
            }}
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
              toast.success(`${product.name} ürünü silindi`);
            }
          }}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs shadow"
        >
          Sil
        </Button>
      </td>
    </tr>
  );
}
