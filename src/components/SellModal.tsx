import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export default function SellModal({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const { items, sellItem } = useStore();
  const item = items.find(i => i.id === itemId);
  const [qty, setQty] = useState("1");
  const [priceEach, setPriceEach] = useState(item?.price.toString() || "0");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!item) return null;

  const qtyNum = parseInt(qty) || 0;
  const priceNum = parseFloat(priceEach) || 0;
  const discNum = parseFloat(discount) || 0;
  const subtotal = qtyNum * priceNum;
  const total = subtotal - discNum;

  const handleSell = async () => {
    setSaving(true);
    const err = await sellItem(itemId, qtyNum, priceNum, discNum, notes.trim() || undefined);
    setSaving(false);
    if (err) { toast({ title: "Error", description: err, variant: "destructive" }); return; }
    toast({ title: "Sale completed!", description: `Sold ${qtyNum}× ${item.name}` });
    onClose();
  };

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sell: {item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Item</Label>
            <Input value={item.name} disabled />
          </div>
          <div className="text-sm text-muted-foreground">Available stock: <strong>{item.quantity}</strong></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity *</Label>
              <Input type="number" min="1" max={item.quantity} value={qty} onChange={e => setQty(e.target.value)} />
            </div>
            <div>
              <Label>Price Each</Label>
              <Input type="number" min="0" step="0.01" value={priceEach} onChange={e => setPriceEach(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Discount</Label>
            <Input type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} />
          </div>
          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <div className="rounded-lg bg-accent p-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {discNum > 0 && <div className="flex justify-between text-destructive"><span>Discount</span><span>-${discNum.toFixed(2)}</span></div>}
            <div className="mt-1 flex justify-between border-t pt-1 font-bold text-base">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSell} disabled={qtyNum < 1 || total < 0 || saving}>
            {saving ? "Processing..." : "Confirm Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
