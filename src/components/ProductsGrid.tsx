import { useState } from "react";
import { type CartItem } from "../types/Product";

type ProductGridProps = {
  products: CartItem[];
  onSelect: (product: CartItem) => void;
};

export default function ProductGrid({ products, onSelect }: ProductGridProps) {
  const categories: string[] = Array.from(
    new Set(products.map((p) => p.category))
  );

  const [activeCategory, setActiveCategory] = useState<string>(
    categories[0] || ""
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 mb-4 pb-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium ${
              activeCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="flex-1 max-h-[500px] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products
            .sort((a, b) => a.name.localeCompare(b.name))
            .filter((p) => p.category === activeCategory)
            .map((product) => (
              <button
                key={product.id}
                onClick={() => onSelect(product)}
                className="bg-white border-2 border-gray-200 rounded-xl shadow-md p-5 flex flex-col items-center justify-center hover:border-blue-500 hover:shadow-lg active:scale-95 transition"
              >
                <span className="text-base font-semibold text-gray-800 text-center mb-1">
                  {product.name}
                </span>
                <span className="text-lg font-bold text-green-600">
                  {product.price} ₺
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
