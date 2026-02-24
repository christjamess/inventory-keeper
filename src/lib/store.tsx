import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth";
import type { Category, Item, Transaction } from "./types";

interface StoreState {
  categories: Category[];
  items: Item[];
  transactions: Transaction[];
  lowStockThreshold: number;
  loading: boolean;
  addCategory: (name: string) => Promise<string | null>;
  editCategory: (id: string, name: string) => Promise<string | null>;
  deleteCategory: (id: string) => Promise<string | null>;
  addItem: (item: Omit<Item, "id">) => Promise<string | null>;
  editItem: (id: string, updates: Partial<Omit<Item, "id">>) => Promise<string | null>;
  deleteItem: (id: string) => Promise<void>;
  sellItem: (itemId: string, qty: number, priceEach: number, discount: number, notes?: string) => Promise<string | null>;
  clearTransactions: () => Promise<string | null>;
  setLowStockThreshold: (v: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const StoreContext = createContext<StoreState | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lowStockThreshold, setLowStockThresholdState] = useState(5);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) { setCategories([]); setItems([]); setTransactions([]); setLoading(false); return; }
    setLoading(true);
    const [catRes, itemRes, txRes, settingsRes] = await Promise.all([
      supabase.from("categories").select("*").order("created_at"),
      supabase.from("items").select("*").order("created_at"),
      supabase.from("transactions").select("*").order("created_at", { ascending: false }),
      supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    setCategories((catRes.data || []).map(c => ({ id: c.id, name: c.name })));
    setItems((itemRes.data || []).map(i => ({
      id: i.id, name: i.name, categoryId: i.category_id,
      quantity: i.quantity, price: Number(i.price),
      image: i.image || undefined, notes: i.notes || undefined,
    })));
    setTransactions((txRes.data || []).map(t => ({
      id: t.id, dateTime: t.created_at, itemId: t.item_id || "",
      itemNameSnapshot: t.item_name_snapshot, qtySold: t.qty_sold,
      priceEach: Number(t.price_each), discount: Number(t.discount),
      totalAmount: Number(t.total_amount), notes: t.notes || undefined,
    })));
    if (settingsRes.data) setLowStockThresholdState(settingsRes.data.low_stock_threshold);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addCategory = useCallback(async (name: string): Promise<string | null> => {
    if (!user) return "Not authenticated";
    const trimmed = name.trim();
    if (!trimmed) return "Category name is required.";
    const { error } = await supabase.from("categories").insert({ user_id: user.id, name: trimmed });
    if (error) {
      if (error.code === "23505") return "Category already exists.";
      return error.message;
    }
    await fetchAll();
    return null;
  }, [user, fetchAll]);

  const editCategory = useCallback(async (id: string, name: string): Promise<string | null> => {
    const trimmed = name.trim();
    if (!trimmed) return "Category name is required.";
    const { error } = await supabase.from("categories").update({ name: trimmed }).eq("id", id);
    if (error) {
      if (error.code === "23505") return "Category already exists.";
      return error.message;
    }
    await fetchAll();
    return null;
  }, [fetchAll]);

  const deleteCategory = useCallback(async (id: string): Promise<string | null> => {
    // Delete all items in this category first
    const { error: itemsErr } = await supabase.from("items").delete().eq("category_id", id);
    if (itemsErr) return itemsErr.message;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return error.message;
    await fetchAll();
    return null;
  }, [fetchAll]);

  const addItem = useCallback(async (item: Omit<Item, "id">): Promise<string | null> => {
    if (!user) return "Not authenticated";
    const trimmed = item.name.trim();
    if (!trimmed) return "Item name is required.";
    if (!item.categoryId) return "Category is required.";
    if (!Number.isInteger(item.quantity) || item.quantity < 0) return "Quantity must be a whole number ≥ 0.";
    if (item.price < 0) return "Price must be ≥ 0.";
    const { error } = await supabase.from("items").insert({
      user_id: user.id, name: trimmed, category_id: item.categoryId,
      quantity: item.quantity, price: item.price,
      image: item.image || null, notes: item.notes || null,
    });
    if (error) {
      if (error.code === "23505") return "Item name already exists.";
      return error.message;
    }
    await fetchAll();
    return null;
  }, [user, fetchAll]);

  const editItem = useCallback(async (id: string, updates: Partial<Omit<Item, "id">>): Promise<string | null> => {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) {
      const trimmed = updates.name.trim();
      if (!trimmed) return "Item name is required.";
      payload.name = trimmed;
    }
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId;
    if (updates.quantity !== undefined) {
      if (!Number.isInteger(updates.quantity) || updates.quantity < 0) return "Quantity must be a whole number ≥ 0.";
      payload.quantity = updates.quantity;
    }
    if (updates.price !== undefined) {
      if (updates.price < 0) return "Price must be ≥ 0.";
      payload.price = updates.price;
    }
    if (updates.image !== undefined) payload.image = updates.image || null;
    if (updates.notes !== undefined) payload.notes = updates.notes || null;

    const { error } = await supabase.from("items").update(payload).eq("id", id);
    if (error) {
      if (error.code === "23505") return "Item name already exists.";
      return error.message;
    }
    await fetchAll();
    return null;
  }, [fetchAll]);

  const deleteItem = useCallback(async (id: string) => {
    await supabase.from("items").delete().eq("id", id);
    await fetchAll();
  }, [fetchAll]);

  const sellItem = useCallback(async (itemId: string, qty: number, priceEach: number, discount: number, notes?: string): Promise<string | null> => {
    if (!user) return "Not authenticated";
    const item = items.find(i => i.id === itemId);
    if (!item) return "Item not found.";
    if (!Number.isInteger(qty) || qty < 1) return "Quantity must be at least 1.";
    if (qty > item.quantity) return "Cannot sell more than available stock.";
    const subtotal = qty * priceEach;
    if (discount > subtotal) return "Discount cannot exceed subtotal.";
    if (discount < 0) return "Discount cannot be negative.";

    // Update item quantity
    const { error: updateErr } = await supabase.from("items")
      .update({ quantity: item.quantity - qty }).eq("id", itemId);
    if (updateErr) return updateErr.message;

    // Create transaction
    const { error: txErr } = await supabase.from("transactions").insert({
      user_id: user.id,
      item_id: itemId,
      item_name_snapshot: item.name,
      qty_sold: qty,
      price_each: priceEach,
      discount,
      total_amount: subtotal - discount,
      notes: notes || null,
    });
    if (txErr) return txErr.message;

    await fetchAll();
    return null;
  }, [user, items, fetchAll]);

  const clearTransactions = useCallback(async (): Promise<string | null> => {
    if (!user) return "Not authenticated";
    const { error } = await supabase.from("transactions").delete().eq("user_id", user.id);
    if (error) return error.message;
    await fetchAll();
    return null;
  }, [user, fetchAll]);

  const setLowStockThreshold = useCallback(async (v: number) => {
    if (!user) return;
    const val = Math.max(0, Math.floor(v));
    setLowStockThresholdState(val);
    await supabase.from("user_settings").upsert({ user_id: user.id, low_stock_threshold: val });
  }, [user]);

  return (
    <StoreContext.Provider value={{
      categories, items, transactions, lowStockThreshold, loading,
      addCategory, editCategory, deleteCategory,
      addItem, editItem, deleteItem, sellItem, clearTransactions,
      setLowStockThreshold, refresh: fetchAll,
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
