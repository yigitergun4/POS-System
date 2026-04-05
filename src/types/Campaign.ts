export interface Campaign {
  id: string;
  name: string;
  isActive: boolean;
  endDate?: string; // YYYY-MM-DD
  targetType: "category" | "products";
  targetCategory?: string;
  targetBarcodes?: string[]; // Array of barcodes for specific products
  conditionPaymentMethod: "ALL" | "cash" | "card";
  effectType: "add_fee_per_item" | "discount_per_item" | "percentage_discount";
  effectValue: number; // For percentage, it's like 10 for 10%
}
