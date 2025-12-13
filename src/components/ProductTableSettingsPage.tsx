import { useState, useEffect } from "react";
import ProductRowSettingsPage from "./ProductRowSettingsPage";
import Pagination from "./Pagination";
import { DEFAULT_PAGE_SIZE, type PageSizeOption } from "../config";
import type { CartItem } from "../types/Product";
import type { ProductTableSettingsPageProps } from "../types/components/index";



export default function ProductTableSettingsPage({
  products,
  filterText,
  onUpdate,
  onDelete,
}: ProductTableSettingsPageProps) {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE as PageSizeOption);

  const filtered: CartItem[] = products.filter(
    (p) =>
      p.name.toLowerCase().includes(filterText.toLowerCase()) ||
      p.barcode.includes(filterText)
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText]);

  // Calculate paginated products
  const startIndex: number = (currentPage - 1) * pageSize;
  const paginatedProducts: CartItem[] = filtered.slice(startIndex, startIndex + pageSize);

  const handlePageChange: (page: number) => void = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange: (size: PageSizeOption) => void = (size: PageSizeOption) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return (
    <div>
      <table className="min-w-full border border-gray-200 text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="border px-3 py-2 text-left">Ürün Adı</th>
            <th className="border px-3 py-2 text-left">Barkod</th>
            <th className="border px-3 py-2 text-center">Fiyat</th>
            <th className="border px-3 py-2 text-center">Stok</th>
            <th className="border px-3 py-2 text-center">Kritik Eşik</th>
            <th className="border px-3 py-2 text-center">Kategori</th>
            <th className="border px-3 py-2 text-center">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {paginatedProducts.map((p) => (
            <ProductRowSettingsPage
              key={p.barcode}
              product={p}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
      <Pagination
        totalItems={filtered.length}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}

