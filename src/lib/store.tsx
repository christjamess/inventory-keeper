import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Category, Item, Transaction } from "./types";

interface StoreState {
  categories: Category[];
  items: Item[];
  transactions: Transaction[];
  lowStockThreshold: number;
  addCategory: (name: string) => string | null; // returns error or null
  editCategory: (id: string, name: string) => string | null;
  deleteCategory: (id: string) => string | null;
  addItem: (item: Omit<Item, "id">) => string | null;
  editItem: (id: string, updates: Partial<Omit<Item, "id">>) => string | null;
  deleteItem: (id: string) => void;
  sellItem: (itemId: string, qty: number, priceEach: number, discount: number, notes?: string) => string | null;
  setLowStockThreshold: (v: number) => void;
}

const StoreContext = createContext<StoreState | null>(null);

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(() => loadJSON("inv_categories", []));
  const [items, setItems] = useState<Item[]>(() => loadJSON("inv_items", []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadJSON("inv_transactions", []));
  const [lowStockThreshold, setLowStockThresholdState] = useState<number>(() => loadJSON("inv_threshold", 5));

  useEffect(() => { localStorage.setItem("inv_categories", JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem("inv_items", JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem("inv_transactions", JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem("inv_threshold", JSON.stringify(lowStockThreshold)); }, [lowStockThreshold]);

  const addCategory = useCallback((name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return "Category name is required.";
    if (categories.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) return "Category already exists.";
    setCategories(prev => [...prev, { id: crypto.randomUUID(), name: trimmed }]);
    return null;
  }, [categories]);

  const editCategory = useCallback((id: string, name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return "Category name is required.";
    if (categories.some(c => c.id !== id && c.name.toLowerCase() === trimmed.toLowerCase())) return "Category already exists.";
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: trimmed } : c));
    return null;
  }, [categories]);

  const deleteCategory = useCallback((id: string): string | null => {
    if (items.some(i => i.categoryId === id)) return "Cannot delete: category has items assigned. Reassign them first.";
    setCategories(prev => prev.filter(c => c.id !== id));
    return null;
  }, [items]);

  const addItem = useCallback((item: Omit<Item, "id">): string | null => {
    const trimmed = item.name.trim();
    if (!trimmed) return "Item name is required.";
    if (items.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) return "Item name already exists.";
    if (!item.categoryId) return "Category is required.";
    if (!Number.isInteger(item.quantity) || item.quantity < 0) return "Quantity must be a whole number ≥ 0.";
    if (item.price < 0) return "Price must be ≥ 0.";
    setItems(prev => [...prev, { ...item, id: crypto.randomUUID(), name: trimmed }]);
    return null;
  }, [items]);

  const editItem = useCallback((id: string, updates: Partial<Omit<Item, "id">>): string | null => {
    if (updates.name !== undefined) {
      const trimmed = updates.name.trim();
      if (!trimmed) return "Item name is required.";
      if (items.some(i => i.id !== id && i.name.toLowerCase() === trimmed.toLowerCase())) return "Item name already exists.";
      updates = { ...updates, name: trimmed };
    }
    if (updates.quantity !== undefined && (!Number.isInteger(updates.quantity) || updates.quantity < 0)) return "Quantity must be a whole number ≥ 0.";
    if (updates.price !== undefined && updates.price < 0) return "Price must be ≥ 0.";
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    return null;
  }, [items]);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const sellItem = useCallback((itemId: string, qty: number, priceEach: number, discount: number, notes?: string): string | null => {
    const item = items.find(i => i.id === itemId);
    if (!item) return "Item not found.";
    if (!Number.isInteger(qty) || qty < 1) return "Quantity must be at least 1.";
    if (qty > item.quantity) return "Cannot sell more than available stock.";
    const subtotal = qty * priceEach;
    if (discount > subtotal) return "Discount cannot exceed subtotal.";
    if (discount < 0) return "Discount cannot be negative.";

    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - qty } : i));
    const tx: Transaction = {
      id: crypto.randomUUID(),
      dateTime: new Date().toISOString(),
      itemId,
      itemNameSnapshot: item.name,
      qtySold: qty,
      priceEach,
      discount,
      totalAmount: subtotal - discount,
      notes,
    };
    setTransactions(prev => [...prev, tx]);
    return null;
  }, [items]);

  const setLowStockThreshold = useCallback((v: number) => {
    setLowStockThresholdState(Math.max(0, Math.floor(v)));
  }, []);

  return (
    <StoreContext.Provider value={{
      categories, items, transactions, lowStockThreshold,
      addCategory, editCategory, deleteCategory,
      addItem, editItem, deleteItem, sellItem,
      setLowStockThreshold,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
