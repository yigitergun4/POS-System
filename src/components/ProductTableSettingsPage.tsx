import ProductRowSettingsPage from "./ProductRowSettingsPage";
import type { CartItem } from "../types/Product";

type Props = {
  products: CartItem[];
  filterText: string;
  onUpdate: (id: string, field: keyof CartItem, value: string | number) => void;
  onDelete: (id: string) => void;
};

export default function ProductTableSettingsPage({
  products,
  filterText,
  onUpdate,
  onDelete,
}: Props) {
  const filtered: CartItem[] = products.filter(
    (p) =>
      p.name.toLowerCase().includes(filterText.toLowerCase()) ||
      p.barcode.includes(filterText)
  );

  return (
    <div>
      <table className="min-w-full border border-gray-200 text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="border px-3 py-2 text-left">Ürün Adı</th>
            <th className="border px-3 py-2 text-left">Barkod</th>
            <th className="border px-3 py-2 text-center">Fiyat</th>
            <th className="border px-3 py-2 text-center">Stok</th>
            <th className="border px-3 py-2 text-center">Kategori</th>
            <th className="border px-3 py-2 text-center">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <ProductRowSettingsPage
              key={p.barcode}
              product={p}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
