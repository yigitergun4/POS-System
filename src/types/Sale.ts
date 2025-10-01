export type Sale = {
  id: string;
  timestamp: { seconds: number; nanoseconds: number };
  total: number;
  paymentMethod: "cash" | "card" | "family";
  items: {
    name: string;
    category?: string;
    price: number;
    qty: number;
    cost?: number;
    barcode: string;
  }[];
};
