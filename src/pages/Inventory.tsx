import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { getStockStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Search, Pencil, Trash2, ShoppingCart, Package, ArrowUpDown } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SellModal from "@/components/SellModal";
import EditItemModal from "@/components/EditItemModal";

type SortKey = "name" | "quantity" | "price" | "value";

export default function Inventory() {
  const { items, categories, deleteItem, lowStockThreshold } = useStore();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sellId, setSellId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.id, c.name])), [categories]);

  const filtered = useMemo(() => {
    let list = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    if (filterCat !== "all") list = list.filter(i => i.categoryId === filterCat);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "quantity") cmp = a.quantity - b.quantity;
      else if (sortKey === "price") cmp = a.price - b.price;
      else cmp = (a.quantity * a.price) - (b.quantity * b.price);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [items, search, filterCat, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const statusBadge = (qty: number) => {
    const s = getStockStatus(qty, lowStockThreshold);
    if (s === "out-of-stock") return <Badge variant="destructive">Out of Stock</Badge>;
    if (s === "low-stock") return <Badge className="bg-warning text-warning-foreground">Low Stock</Badge>;
    return <Badge className="bg-success text-success-foreground">In Stock</Badge>;
  };

  const handleDelete = () => {
    if (deleteId) { deleteItem(deleteId); toast({ title: "Item deleted" }); setDeleteId(null); }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Inventory</h1>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-lg font-medium">No items found</p>
          <p className="text-sm">Add items from the Dashboard page.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2.5 text-left font-medium">Image</th>
                <th className="px-3 py-2.5 text-left font-medium cursor-pointer" onClick={() => toggleSort("name")}>
                  <span className="inline-flex items-center gap-1">Name <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="px-3 py-2.5 text-left font-medium">Category</th>
                <th className="px-3 py-2.5 text-right font-medium cursor-pointer" onClick={() => toggleSort("quantity")}>
                  <span className="inline-flex items-center gap-1">Qty <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="px-3 py-2.5 text-right font-medium cursor-pointer" onClick={() => toggleSort("price")}>
                  <span className="inline-flex items-center gap-1">Price <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="px-3 py-2.5 text-right font-medium cursor-pointer" onClick={() => toggleSort("value")}>
                  <span className="inline-flex items-center gap-1">Value <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="px-3 py-2.5 text-center font-medium">Status</th>
                <th className="px-3 py-2.5 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{catMap[item.categoryId] || "—"}</td>
                  <td className="px-3 py-2 text-right">{item.quantity}</td>
                  <td className="px-3 py-2 text-right">${item.price.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right font-medium">${(item.quantity * item.price).toFixed(2)}</td>
                  <td className="px-3 py-2 text-center">{statusBadge(item.quantity)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(item.id)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => setSellId(item.id)} disabled={item.quantity === 0}>
                        <ShoppingCart className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>The item will be removed from inventory. Existing transaction history will be preserved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sell modal */}
      {sellId && <SellModal itemId={sellId} onClose={() => setSellId(null)} />}
      {editId && <EditItemModal itemId={editId} onClose={() => setEditId(null)} />}
    </div>
  );
}
