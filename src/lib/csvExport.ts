import { format } from "date-fns";
import type { Sale } from "../types/Sale";
import { toast } from "react-toastify";
import type { PredefinedReport } from "./dateRanges";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Nakit",
  card: "Kart",
  family: "Aile",
  split: "Bölüşümlü"
};

/**
 * Exports sales data to a Power BI compatible UTF-8 BOM CSV file.
 * @param salesToExport Array of sales to include in the CSV
 * @param filenameSuffix Optional custom suffix for the filename
 * @param locale Regional format preference ("tr" or "en")
 */
export const exportSalesToCSV: (
  salesToExport: Sale[],
  filenameSuffix?: string,
  locale?: "tr" | "en"
) => void = (
  salesToExport: Sale[],
  filenameSuffix?: string,
  locale: "tr" | "en" = "tr"
): void => {
    const delimiter: string = locale === "en" ? "," : ";";
    const decimalSep: string = locale === "en" ? "." : ",";

    const formatNumber: (num: number) => string = (num: number): string => {
      const rounded: number = Math.round(num * 100) / 100;
      return rounded.toString().replace(".", decimalSep);
    };

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
          formatNumber(itemCost),
          formatNumber(itemPrice),
          formatNumber(discount),
          formatNumber(itemTotal),
          formatNumber(itemTotalCost),
          formatNumber(proratedCommission),
          formatNumber(itemProfit)
        ]);
      });
    });

    // Use BOM and appropriate delimiter for regional support
    const csvContent: string = "\uFEFF" + [
      headers.join(delimiter),
      ...rows.map(row => row.map(val => {
        if (typeof val === "string") {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(delimiter))
    ].join("\n");

    const blob: Blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url: string = URL.createObjectURL(blob);
    const link: HTMLAnchorElement = document.createElement("a");
    link.setAttribute("href", url);
    const suffix = filenameSuffix || format(new Date(), "dd.MM.yyyy");
    link.setAttribute("download", `POS_Satis_Verisi_PowerBI_${suffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Satış verisi Power BI uyumlu CSV olarak başarıyla indirildi! 📊✅");
  };

/**
 * Filters sales for a predefined report period and exports it.
 * @param sales All sales from db
 * @param report The predefined report configuration to export
 * @param locale Regional format preference ("tr" or "en")
 */
export const exportPredefinedReport: (
  sales: Sale[],
  report: PredefinedReport,
  locale?: "tr" | "en"
) => void = (
  sales: Sale[],
  report: PredefinedReport,
  locale: "tr" | "en" = "tr"
): void => {
    const today: Date = new Date();
    const { from, to } = report.getDateRange(today);
    const filtered: Sale[] = sales.filter((s: Sale) => {
      const d: Date = new Date(s.timestamp.seconds * 1000);
      return d >= from && d <= to;
    });

    const suffix: string = report.getFilenameSuffix(today);
    exportSalesToCSV(filtered, suffix, locale);
  };
