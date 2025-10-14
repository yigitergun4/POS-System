export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  barcode: string;
  category: string;
};

export interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
  category: string;
  stock?: number;
}
