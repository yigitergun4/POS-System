import { useState, useMemo } from "react";
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
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredProducts: CartItem[] = useMemo(() => {
    return products
      .filter((p) => p.category === activeCategory)
      .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, activeCategory, searchTerm]);

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
      <div className="mb-3 px-1">
        <input
          type="text"
          placeholder="Ürün ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex-1 max-h-[500px] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product: CartItem) => (
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
