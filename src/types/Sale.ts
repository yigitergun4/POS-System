export type Sale = {
  id: string;
  total: number;
  paymentMethod: "cash" | "card" | "family";
  timestamp: { seconds: number; nanoseconds: number };
  items: { name: string; qty: number; category?: string; price?: number }[];
};
