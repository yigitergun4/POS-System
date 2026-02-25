import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import type { Sale } from "../types/Sale";
import { useAuth } from "../contexts/AuthContext";
import { useConfirmation } from "../contexts/ConfirmationContext";
import { deleteDoc, doc, runTransaction } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-toastify";
import Pagination from "./Pagination";
import { DEFAULT_PAGE_SIZE, type PageSizeOption } from "../config";

type PaymentMethodFilter = "all" | "cash" | "card" | "family" | "split";

const PAYMENT_METHOD_CONFIG: Record<
  "cash" | "card" | "family" | "split",
  { label: string; bgColor: string; textColor: string; icon: string }
> = {
  cash: {
    label: "Nakit",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    icon: "💵",
  },
  card: {
    label: "Kart",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    icon: "💳",
  },
  family: {
    label: "Aile",
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
    icon: "👨‍👩‍👧",
  },
  split: {
    label: "Bölüşümlü",
    bgColor: "bg-amber-100",
    textColor: "text-amber-800",
    icon: "✂️",
  },
};

const PAYMENT_FILTER_LABELS: Record<PaymentMethodFilter, string> = {
  all: "Tümü",
  cash: "💵 Nakit",
  card: "💳 Kart",
  family: "👨‍👩‍👧 Aile",
  split: "✂️ Bölüşümlü",
};

function SalesTable({ filteredSales }: { filteredSales: Sale[] }) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<"date" | "total" | "qty" | null>(
    "date"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(
    DEFAULT_PAGE_SIZE as PageSizeOption
  );
  const [searchText, setSearchText] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] =
    useState<PaymentMethodFilter>("all");
  const { user } = useAuth();
  const { confirm } = useConfirmation();

  // Reset filters and page when filteredSales changes (date range changes)
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredSales]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, paymentMethodFilter]);

  // Apply local filters to already date-filtered sales
  const localFilteredSales: Sale[] = useMemo(() => {
    return filteredSales.filter((sale) => {
      // Payment method filter
      if (
        paymentMethodFilter !== "all" &&
        sale.paymentMethod !== paymentMethodFilter
      ) {
        return false;
      }

      // Text search - search in product names
      if (searchText.trim()) {
        const searchLower: string = searchText.toLowerCase();
        const hasMatchingItem: boolean = sale.items.some((item) =>
          item.name.toLowerCase().includes(searchLower)
        );
        if (!hasMatchingItem) {
          return false;
        }
      }

      return true;
    });
  }, [filteredSales, searchText, paymentMethodFilter]);

  const handleSort: (field: "date" | "total" | "qty") => void = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedSales: Sale[] = [...localFilteredSales].sort((a, b) => {
    if (!sortField) return b.timestamp.seconds - a.timestamp.seconds;
    let valA: number, valB: number;

    if (sortField === "date") {
      valA = a.timestamp.seconds;
      valB = b.timestamp.seconds;
    } else if (sortField === "total") {
      valA = a.total;
      valB = b.total;
    } else {
      valA = a.items.reduce((sum, i) => sum + i.qty, 0);
      valB = b.items.reduce((sum, i) => sum + i.qty, 0);
    }

    return sortOrder === "asc" ? valA - valB : valB - valA;
  });

  // Calculate paginated sales
  const startIndex: number = (currentPage - 1) * pageSize;
  const paginatedSales: Sale[] = sortedSales.slice(
    startIndex,
    startIndex + pageSize
  );

  const handlePageChange: (page: number) => void = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange: (size: PageSizeOption) => void = (
    size: PageSizeOption
  ) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleClearFilters: () => void = () => {
    setSearchText("");
    setPaymentMethodFilter("all");
  };

  const handleDelete: (sale: Sale) => Promise<void> = async (sale) => {
    if (!sale?.id) {
      toast.error("Silinecek satış ID bulunamadı ❌");
      return;
    }

    try {
      await Promise.all(
        sale.items.map(async (item) => {
          if (!item.name) return;
          const productRef = doc(db, "products", item.barcode!);

          await runTransaction(db, async (transaction) => {
            const productSnap = await transaction.get(productRef);
            if (!productSnap.exists()) return;

            const currentQty = productSnap.data().qty || 0;
            transaction.update(productRef, {
              qty: currentQty + item.qty,
            });
          });
        })
      );
      await deleteDoc(doc(db, "sales", sale.id));
      toast.success("Satış silindi ve stok geri eklendi ✅");
    } catch (err) {
      console.error("Satış silinirken hata:", err);
      toast.error("Satış silinemedi ❌");
    }
  };

  const deleteSale: (sale: Sale) => Promise<void> = async (sale) => {
    const isConfirmed = await confirm({
      title: "Satışı Sil",
      message: "Bu satışı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve stoklar geri yüklenecektir.",
      type: "danger",
      confirmText: "Evet, Sil",
      cancelText: "Vazgeç"
    });

    if (isConfirmed) {
      await handleDelete(sale);
    }
  };

  const hasActiveFilters: boolean =
    searchText.trim() !== "" || paymentMethodFilter !== "all";

  // Get row background color based on payment method
  const getRowStyles = (
    paymentMethod: "cash" | "card" | "family" | "split",
    index: number
  ): string => {
    const isEven: boolean = index % 2 === 0;
    const baseStripe: string = isEven ? "bg-gray-50" : "bg-white";

    // Add subtle left border color based on payment method
    const borderColors: Record<string, string> = {
      cash: "border-l-4 border-l-green-400",
      card: "border-l-4 border-l-blue-400",
      family: "border-l-4 border-l-purple-400",
      split: "border-l-4 border-l-amber-400",
    };

    return `${baseStripe} ${borderColors[paymentMethod]} hover:bg-gray-100 transition-colors`;
  };

  const toggleRowExpanded: (saleId: string) => void = (saleId: string) => {
    setExpandedRows((prev: Set<string>) => {
      const newSet: Set<string> = new Set(prev);
      if (newSet.has(saleId)) {
        newSet.delete(saleId);
      } else {
        newSet.add(saleId);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📋 Satış Listesi
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-300">
              Toplam{" "}
              <span className="font-bold text-white">
                {localFilteredSales.length}
              </span>{" "}
              satış
            </span>
            {/* Summary badges */}
            <div className="flex gap-2">
              {(["cash", "card", "family"] as const).map((method) => {
                const count: number = localFilteredSales.filter(
                  (s) => s.paymentMethod === method
                ).length;
                if (count === 0) return null;
                const config = PAYMENT_METHOD_CONFIG[method];
                return (
                  <span
                    key={method}
                    className={`px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
                  >
                    {config.icon} {count}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 border-b border-gray-200">
        {/* Text Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              id="salesSearch"
              type="text"
              placeholder="🔍 Ürün adı ara..."
              value={searchText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchText(e.target.value)
              }
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-56 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
          </div>
        </div>

        {/* Payment Method Filter - Button Group */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          {(Object.keys(PAYMENT_FILTER_LABELS) as PaymentMethodFilter[]).map(
            (key) => (
              <button
                key={key}
                onClick={() => setPaymentMethodFilter(key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${paymentMethodFilter === key
                  ? key === "all"
                    ? "bg-gray-700 text-white shadow"
                    : key === "cash"
                      ? "bg-green-500 text-white shadow"
                      : key === "card"
                        ? "bg-blue-500 text-white shadow"
                        : "bg-purple-500 text-white shadow"
                  : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {PAYMENT_FILTER_LABELS[key]}
              </button>
            )
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors shadow-sm"
          >
            ✕ Temizle
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100 border-b-2 border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("date")}
                  className="flex items-center gap-1 hover:text-gray-900"
                >
                  📅 Tarih
                  {sortField === "date" && (
                    <span className="text-blue-600">
                      {sortOrder === "desc" ? "▼" : "▲"}
                    </span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ödeme
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("total")}
                  className="flex items-center gap-1 justify-end hover:text-gray-900"
                >
                  💰 Tutar
                  {sortField === "total" && (
                    <span className="text-blue-600">
                      {sortOrder === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button
                  onClick={() => handleSort("qty")}
                  className="flex items-center gap-1 justify-center hover:text-gray-900"
                >
                  📦 Adet
                  {sortField === "qty" && (
                    <span className="text-blue-600">
                      {sortOrder === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Ürünler
              </th>
              {user?.role === "admin" && (
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  İşlem
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedSales.length > 0 ? (
              paginatedSales.map((sale, index) => {
                const paymentConfig = PAYMENT_METHOD_CONFIG[sale.paymentMethod];
                return (
                  <tr
                    key={sale.id}
                    className={getRowStyles(sale.paymentMethod, index)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">
                          {format(
                            new Date(sale.timestamp.seconds * 1000),
                            "dd/MM/yyyy"
                          )}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(
                            new Date(sale.timestamp.seconds * 1000),
                            "HH:mm"
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${paymentConfig.bgColor} ${paymentConfig.textColor}`}
                      >
                        {paymentConfig.icon} {paymentConfig.label}
                      </span>
                      {sale.paymentMethod === "split" && sale.splitDetails && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className="inline-flex items-center gap-0.5 text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-md whitespace-nowrap">
                            💵 ₺{sale.splitDetails.cashAmount.toLocaleString("tr-TR")}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md whitespace-nowrap">
                            💳 ₺{sale.splitDetails.cardAmount.toLocaleString("tr-TR")}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-lg font-bold text-gray-900">
                        ₺{sale.total.toLocaleString("tr-TR")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-semibold text-sm">
                        {sale.items.reduce((sum, item) => sum + item.qty, 0)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 items-center">
                        {(expandedRows.has(sale.id) ? sale.items : sale.items.slice(0, 3)).map((item, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs"
                          >
                            {item.name}
                            <span className="ml-1 text-gray-500">
                              ×{item.qty}
                            </span>
                          </span>
                        ))}
                        {sale.items.length > 3 && (
                          <button
                            onClick={() => toggleRowExpanded(sale.id)}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 text-xs font-medium cursor-pointer transition-colors"
                          >
                            {expandedRows.has(sale.id)
                              ? "Gizle"
                              : `+${sale.items.length - 3} daha`}
                          </button>
                        )}
                      </div>
                    </td>
                    {user?.role === "admin" && (
                      <td className="px-4 py-3 text-center">
                        <button
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                          onClick={() => deleteSale(sale)}
                        >
                          🗑️ Sil
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={user?.role === "admin" ? 6 : 5}
                  className="text-center py-12"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">📭</span>
                    <span className="text-gray-500 font-medium">
                      {hasActiveFilters
                        ? "Filtreye uygun satış bulunamadı"
                        : "Seçilen aralıkta satış yok"}
                    </span>
                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Filtreleri temizle
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sortedSales.length > 0 && (
        <Pagination
          totalItems={sortedSales.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}

export default SalesTable;



