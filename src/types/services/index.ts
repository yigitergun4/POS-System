export interface ChatRequest {
    question: string;
}

export interface ChatResponse {
    content: string;
    timestamp: string;
    status: string;
}

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
