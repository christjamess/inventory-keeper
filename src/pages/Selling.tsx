import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DollarSign, ShoppingCart, Receipt, Search, Download, Trash2 } from "lucide-react";
import { format, isToday, isThisWeek, isThisMonth } from "date-fns";
import { toast } from "@/hooks/use-toast";

type TimeFilter = "all" | "today" | "week" | "month";

export default function Selling() {
  const { transactions, clearTransactions } = useStore();
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (search) list = list.filter(t => t.itemNameSnapshot.toLowerCase().includes(search.toLowerCase()));
    if (timeFilter === "today") list = list.filter(t => isToday(new Date(t.dateTime)));
    else if (timeFilter === "week") list = list.filter(t => isThisWeek(new Date(t.dateTime)));
    else if (timeFilter === "month") list = list.filter(t => isThisMonth(new Date(t.dateTime)));
    return list.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [transactions, search, timeFilter]);

  const totalRevenue = filtered.reduce((s, t) => s + t.totalAmount, 0);
  const totalQty = filtered.reduce((s, t) => s + t.qtySold, 0);

  const exportCSV = () => {
    const header = "Date,Item,Quantity,Price Each,Discount,Total,Notes\n";
    const rows = filtered.map(t =>
      `"${format(new Date(t.dateTime), "yyyy-MM-dd HH:mm")}","${t.itemNameSnapshot}",${t.qtySold},${t.priceEach},${t.discount},${t.totalAmount},"${t.notes || ""}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const overviewCards = [
    { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign },
    { label: "Items Sold", value: totalQty, icon: ShoppingCart },
    { label: "Transactions", value: filtered.length, icon: Receipt },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Selling</h1>

      {/* Overview cards */}
      <div className="grid gap-4 grid-cols-3 mb-6">
        {overviewCards.map(c => (
          <div key={c.label} className="stat-card-blue">
            <c.icon className="h-5 w-5 mb-2 opacity-80" />
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs opacity-80">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by item name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={timeFilter} onValueChange={v => setTimeFilter(v as TimeFilter)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCSV} disabled={filtered.length === 0}>
          <Download className="mr-1 h-4 w-4" /> Export CSV
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={transactions.length === 0}>
              <Trash2 className="mr-1 h-4 w-4" /> Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all transaction history?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your transaction records. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={async () => {
                  const err = await clearTransactions();
                  if (err) toast({ title: "Error", description: err, variant: "destructive" });
                  else toast({ title: "Cleared", description: "All transaction history has been deleted." });
                }}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Receipt className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-lg font-medium">No transactions yet</p>
          <p className="text-sm">Sell items from the Inventory page.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2.5 text-left font-medium">Date & Time</th>
                <th className="px-3 py-2.5 text-left font-medium">Item</th>
                <th className="px-3 py-2.5 text-right font-medium">Qty</th>
                <th className="px-3 py-2.5 text-right font-medium">Price</th>
                <th className="px-3 py-2.5 text-right font-medium">Discount</th>
                <th className="px-3 py-2.5 text-right font-medium">Total</th>
                <th className="px-3 py-2.5 text-left font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{format(new Date(t.dateTime), "MMM dd, yyyy HH:mm")}</td>
                  <td className="px-3 py-2 font-medium">{t.itemNameSnapshot}</td>
                  <td className="px-3 py-2 text-right">{t.qtySold}</td>
                  <td className="px-3 py-2 text-right">${t.priceEach.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">{t.discount > 0 ? `-$${t.discount.toFixed(2)}` : "—"}</td>
                  <td className="px-3 py-2 text-right font-semibold">${t.totalAmount.toFixed(2)}</td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[150px] truncate">{t.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
