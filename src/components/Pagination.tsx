import { PAGE_SIZE_OPTIONS, type PageSizeOption } from "../config";
import type { PaginationProps } from "../types/components/index";

/**
 * Reusable pagination component with page navigation and page size selection.
 */
export default function Pagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages: number = Math.ceil(totalItems / pageSize);
  const startItem: number = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem: number = Math.min(currentPage * pageSize, totalItems);

  const handlePrevious: () => void = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext: () => void = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize: PageSizeOption = Number(e.target.value) as PageSizeOption;
    onPageSizeChange(newSize);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
      {/* Items info */}
      <div className="text-sm text-gray-600">
        <span className="font-medium">{startItem}</span>
        {" - "}
        <span className="font-medium">{endItem}</span>
        {" / "}
        <span className="font-medium">{totalItems}</span>
        {" öğe"}
      </div>

      {/* Page size selector */}
      <div className="flex items-center gap-2 text-sm">
        <label htmlFor="pageSize" className="text-gray-600">
          Sayfa başına:
        </label>
        <select
          id="pageSize"
          value={pageSize}
          onChange={handlePageSizeChange}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage <= 1}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Önceki
        </button>
        <span className="text-sm text-gray-600">
          Sayfa{" "}
          <span className="font-medium">{totalPages === 0 ? 0 : currentPage}</span>
          {" / "}
          <span className="font-medium">{totalPages}</span>
        </span>
        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sonraki →
        </button>
      </div>
    </div>
  );
}
