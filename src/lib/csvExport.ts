import { format } from "date-fns";
import type { Sale } from "../types/Sale";
import { toast } from "react-toastify";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Nakit",
  card: "Kart",
  family: "Aile",
  split: "Bölüşümlü"
};

/**
 * Exports sales data to a Power BI compatible UTF-8 BOM CSV file.
 * @param salesToExport Array of sales to include in the CSV
 */
export const exportSalesToCSV = (salesToExport: Sale[]): void => {
  const headers: string[] = [
    "Satış ID",
    "Tarih",
    "Gün",
    "Ödeme Yöntemi",
    "Ürün Barkod",
    "Ürün Adı",
    "Kategori",
    "Adet",
    "Birim Alış Fiyatı (Maliyet)",
    "Birim Satış Fiyatı",
    "Birim İndirim",
    "Satır Toplam Tutar",
    "Satır Toplam Maliyet",
    "Satır Komisyon Kesintisi",
    "Satır Net Kâr"
  ];

  const rows: (string | number)[][] = [];

  salesToExport.forEach((sale: Sale) => {
    const saleDate: Date = new Date(sale.timestamp.seconds * 1000);
    const formattedDate: string = format(saleDate, "yyyy-MM-dd HH:mm:ss");
    const formattedDay: string = format(saleDate, "yyyy-MM-dd");
    const paymentMethodLabel: string = PAYMENT_METHOD_LABELS[sale.paymentMethod] || sale.paymentMethod;
    const cardCommission: number = sale.cardCommission || 0;
    const total: number = sale.total || 1;

    sale.items.forEach((item) => {
      const itemPrice: number = item.price || 0;
      const itemQty: number = item.qty || 0;
      const itemCost: number = item.cost || 0;
      const discount: number = item.discountAmount || 0;

      const itemTotal: number = itemPrice * itemQty;
      const itemTotalCost: number = itemCost * itemQty;

      // Pro-rate commission based on item's share of total sale price
      const proratedCommission: number = total > 0 ? (itemTotal / total) * cardCommission : 0;
      const itemProfit: number = itemTotal - itemTotalCost - proratedCommission;

      rows.push([
        sale.id,
        formattedDate,
        formattedDay,
        paymentMethodLabel,
        item.barcode || "",
        item.name,
        item.category || "Diğer",
        itemQty,
        itemCost,
        itemPrice,
        discount,
        itemTotal,
        itemTotalCost,
        Math.round(proratedCommission * 100) / 100,
        Math.round(itemProfit * 100) / 100
      ]);
    });
  });

  // Use BOM and semicolon separator for Turkish Excel/Power BI support
  const csvContent: string = "\uFEFF" + [
    headers.join(";"),
    ...rows.map(row => row.map(val => {
      if (typeof val === "string") {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(";"))
  ].join("\n");

  const blob: Blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url: string = URL.createObjectURL(blob);
  const link: HTMLAnchorElement = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `POS_Satis_Verisi_PowerBI_${format(new Date(), "dd.MM.yyyy")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast.success("Tüm satış verisi Power BI uyumlu CSV olarak başarıyla indirildi! 📊✅");
};
