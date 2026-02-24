import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { getStockStatus } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Package, Boxes, DollarSign, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Summary() {
  const { items, lowStockThreshold, setLowStockThreshold } = useStore();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    const totalValue = items.reduce((s, i) => s + i.quantity * i.price, 0);
    const lowStock = items.filter(i => getStockStatus(i.quantity, lowStockThreshold) === "low-stock");
    const outOfStock = items.filter(i => i.quantity === 0);
    const top5 = [...items].sort((a, b) => (b.quantity * b.price) - (a.quantity * a.price)).slice(0, 5);
    return { totalQty, totalValue, lowStock, outOfStock, top5 };
  }, [items, lowStockThreshold]);

  const statCards = [
    { label: "Total Unique Items", value: items.length, icon: Package },
    { label: "Total Quantity", value: stats.totalQty, icon: Boxes },
    { label: "Inventory Value", value: `$${stats.totalValue.toFixed(2)}`, icon: DollarSign },
    { label: "Low Stock", value: stats.lowStock.length, icon: AlertTriangle },
    { label: "Out of Stock", value: stats.outOfStock.length, icon: XCircle },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Summary</h1>
        <div className="flex items-center gap-2">
          <Label htmlFor="threshold" className="text-sm text-muted-foreground whitespace-nowrap">Low stock threshold:</Label>
          <Input
            id="threshold"
            type="number"
            min="0"
            className="w-20 h-8"
            value={lowStockThreshold}
            onChange={e => setLowStockThreshold(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5 mb-8">
        {statCards.map(s => (
          <div key={s.label} className="stat-card-blue">
            <s.icon className="h-5 w-5 mb-2 opacity-80" />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top 5 */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><TrendingUp className="h-5 w-5 text-primary" /> Top 5 by Value</h2>
          {stats.top5.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No items yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.top5.map((item, i) => (
                <li key={item.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                  <span className="text-sm font-semibold">${(item.quantity * item.price).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Low stock */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><AlertTriangle className="h-5 w-5 text-warning" /> Low Stock Items</h2>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">All items are well stocked!</p>
          ) : (
            <ul className="space-y-2">
              {stats.lowStock.map(item => (
                <li key={item.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                  <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                  <Badge className="bg-warning text-warning-foreground">{item.quantity} left</Badge>
                  <button
                    className="text-xs text-primary hover:underline"
                    onClick={() => navigate(`/inventory?search=${encodeURIComponent(item.name)}`)}
                  >View</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
