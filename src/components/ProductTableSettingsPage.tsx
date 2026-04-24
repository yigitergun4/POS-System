import { useState, useEffect, useMemo } from "react";
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
  const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("Tümü");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [openFilter, setOpenFilter] = useState<"category" | "supplier" | null>(null);

  const categories = useMemo(() => ["Tümü", ...new Set(products.map(p => p.category))].sort(), [products]);
  const suppliers = useMemo(() => ["Tümü", ...new Set(products.map(p => p.supplier || "Bilinmiyor"))].sort(), [products]);

  const getMargin = (p: CartItem) => (p.price > 0 ? ((p.price - (p.cost ?? 0)) / p.price) * 100 : 0);

  const filtered = useMemo(() => {
    let result = products.filter(p => 
      (p.name.toLowerCase().includes(filterText.toLowerCase()) || p.barcode.includes(filterText)) &&
      (selectedCategory === "Tümü" || p.category === selectedCategory) &&
      (selectedSupplier === "Tümü" || (p.supplier || "Bilinmiyor") === selectedSupplier)
    );

    if (sortOrder) {
      result.sort((a, b) => {
        const valA = getMargin(a);
        const valB = getMargin(b);
        return sortOrder === "asc" ? valA - valB : valB - valA;
      });
    }

    return result;
  }, [products, filterText, selectedCategory, selectedSupplier, sortOrder]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText, selectedCategory, selectedSupplier, sortOrder]);

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-visible relative">
      <div className="overflow-x-auto rounded-2xl">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-gray-50/50 text-gray-500 backdrop-blur-md sticky top-0 z-10 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider">Ürün Bilgisi</th>
              <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider">Barkod</th>
              <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider">Satış</th>
              <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider">Alış</th>
              <th 
                className={`px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all hover:bg-indigo-50 group ${sortOrder ? 'text-indigo-600 bg-indigo-50/50' : ''}`}
                onClick={() => setSortOrder(prev => prev === "desc" ? "asc" : prev === "asc" ? null : "desc")}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Kâr (%)</span>
                  <span className={`text-[10px] ${sortOrder ? 'opacity-100' : 'opacity-30 group-hover:opacity-100'}`}>
                    {sortOrder === "asc" ? "▲" : sortOrder === "desc" ? "▼" : "⇅"}
                  </span>
                </div>
              </th>
              <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider relative">
                <button 
                  onClick={() => setOpenFilter(openFilter === "supplier" ? null : "supplier")}
                  className={`flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg transition-all ${selectedSupplier !== "Tümü" ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'hover:bg-gray-100'}`}
                >
                  <span>Toptancı</span>
                  <span className="text-[10px] opacity-40">▼</span>
                </button>
                
                {openFilter === "supplier" && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setOpenFilter(null)} />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl z-30 py-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-2 border-b border-gray-50 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-tight">Toptancı Filtrele</div>
                      {suppliers.map(s => (
                        <button
                          key={s}
                          onClick={() => {
                            setSelectedSupplier(s);
                            setOpenFilter(null);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs hover:bg-indigo-50 transition-colors flex items-center justify-between ${selectedSupplier === s ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-gray-600'}`}
                        >
                          {s}
                          {selectedSupplier === s && <span className="bg-indigo-600 w-1.5 h-1.5 rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </th>
              <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider">Stok</th>
              <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider">Eşik</th>
              <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider relative">
                <button 
                  onClick={() => setOpenFilter(openFilter === "category" ? null : "category")}
                  className={`flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg transition-all ${selectedCategory !== "Tümü" ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'hover:bg-gray-100'}`}
                >
                  <span>Kategori</span>
                  <span className="text-[10px] opacity-40">▼</span>
                </button>

                {openFilter === "category" && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setOpenFilter(null)} />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-2xl z-30 py-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-2 border-b border-gray-50 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-tight">Kategori Filtrele</div>
                      {categories.map(c => (
                        <button
                          key={c}
                          onClick={() => {
                            setSelectedCategory(c);
                            setOpenFilter(null);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs hover:bg-indigo-50 transition-colors flex items-center justify-between ${selectedCategory === c ? 'text-indigo-600 font-bold bg-indigo-50/50' : 'text-gray-600'}`}
                        >
                          {c}
                          {selectedCategory === c && <span className="bg-indigo-600 w-1.5 h-1.5 rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </th>
              <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider w-28">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
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

        {filtered.length === 0 && (
          <div className="py-24 text-center bg-white">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl">🔍</div>
              <div>
                <p className="font-bold text-gray-800">Ürün bulunamadı</p>
                <p className="text-xs text-gray-400 mt-1">Lütfen filtrelerinizi veya arama metninizi kontrol edin.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-50 backdrop-blur-sm rounded-b-2xl">
        <Pagination
          totalItems={filtered.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </div>
  );
}

