import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface PriceLog {
  id?: string;
  barcode: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  oldCost: number;
  newCost: number;
  timestamp: any; // Date or Firestore Timestamp
  source: "add_product" | "update_product" | "supplier_adjustment";
  details?: string;
}

export const logPriceChange = async (log: Omit<PriceLog, "timestamp">): Promise<void> => {
  try {
    await addDoc(collection(db, "priceLogs"), {
      ...log,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Fiyat geçmişi kaydedilirken hata:", error);
  }
};
