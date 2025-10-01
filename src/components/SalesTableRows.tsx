import { useState } from "react";
import { format } from "date-fns";
import type { Sale } from "../types/Sale";
import { useAuth } from "../contexts/AuthContext";
import { deleteDoc, doc, runTransaction } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "react-toastify";

function SalesTable({ filteredSales }: { filteredSales: Sale[] }) {
  const [sortField, setSortField] = useState<"date" | "total" | "qty" | null>(
    "date"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { user } = useAuth();

  const handleSort: (field: "date" | "total" | "qty") => void = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const sortedSales: Sale[] = [...filteredSales].sort((a, b) => {
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

  return (
    <div className="bg-white shadow-md rounded-xl border border-gray-200 p-4 overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4">📋 Satış Listesi</h2>
      <table className="min-w-full border border-gray-200 text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="border px-3 py-2">
              <button onClick={() => handleSort("date")}>
                Tarih{" "}
                {sortField === "date" && (sortOrder === "desc" ? "▼" : "▲")}
              </button>
            </th>
            <th className="border px-3 py-2">Ödeme Yöntemi</th>
            <th className="border px-3 py-2 text-right">
              <button onClick={() => handleSort("total")} className="ml-1">
                <div className="flex items-center justify-end">
                  <span>Tutar</span>
                  {sortField === "total" && (sortOrder === "asc" ? "▲" : "▼")}
                </div>
              </button>
            </th>
            <th className="border px-3 py-2 text-center">
              <button onClick={() => handleSort("qty")} className="ml-1">
                <div className="flex items-center justify-center">
                  <span>Toplam Ürün</span>
                  {sortField === "qty" && (sortOrder === "asc" ? "▲" : "▼")}
                </div>
              </button>
            </th>
            <th className="border px-3 py-2">Ürünler</th>
            {user?.role === "admin" && (
              <th className="border px-3 py-2">Sil</th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedSales.length > 0 ? (
            sortedSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-gray-50">
                <td className="border px-3 py-2">
                  {format(
                    new Date(sale.timestamp.seconds * 1000),
                    "dd/MM/yyyy HH:mm"
                  )}
                </td>
                <td className="border px-3 py-2 capitalize">
                  {sale.paymentMethod}
                </td>
                <td className="border px-3 py-2 text-right font-semibold">
                  ₺ {sale.total.toLocaleString()}
                </td>
                <td className="border px-3 py-2 text-center">
                  {sale.items.reduce((sum, item) => sum + item.qty, 0)}
                </td>
                <td className="border px-3 py-2">
                  <ul className="list-disc list-inside text-gray-600">
                    {sale.items.map((item, i) => (
                      <li key={i}>
                        {item.name} x{item.qty}
                      </li>
                    ))}
                  </ul>
                </td>
                {user?.role === "admin" && (
                  <td className="border px-3 py-2 text-center">
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                      onClick={() => handleDelete(sale)}
                    >
                      Satışı sil
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={7}
                className="text-center text-gray-500 py-4 font-semibold"
              >
                Seçilen aralıkta satış yok
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SalesTable;
