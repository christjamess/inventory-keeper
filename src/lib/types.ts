export interface Category {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  categoryId: string;
  quantity: number;
  price: number;
  image?: string; // base64 data URL
  notes?: string;
}

export interface Transaction {
  id: string;
  dateTime: string; // ISO string
  itemId: string;
  itemNameSnapshot: string;
  qtySold: number;
  priceEach: number;
  discount: number;
  totalAmount: number;
  notes?: string;
}

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export function getStockStatus(quantity: number, threshold: number): StockStatus {
  if (quantity === 0) return "out-of-stock";
  if (quantity <= threshold) return "low-stock";
  return "in-stock";
}
