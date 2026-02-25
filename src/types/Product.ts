export type CartItem = {
  id: string;
  name: string;
  price: number;
  cost?: number;
  supplier?: string;
  qty: number;
  barcode: string;
  category: string;
  threshold?: number;
};

export interface Product {
  id: string;
  name: string;
  price: number;
  cost?: number;
  supplier?: string;
  barcode: string;
  category: string;
  stock?: number;
  threshold?: number;
}

