import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ImagePlus, X } from "lucide-react";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function EditItemModal({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const { items, categories, editItem } = useStore();
  const item = items.find(i => i.id === itemId);
  const [name, setName] = useState(item?.name || "");
  const [categoryId, setCategoryId] = useState(item?.categoryId || "");
  const [quantity, setQuantity] = useState(item?.quantity.toString() || "0");
  const [price, setPrice] = useState(item?.price.toString() || "0");
  const [image, setImage] = useState<string | undefined>(item?.image);
  const [notes, setNotes] = useState(item?.notes || "");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!item) return null;

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Error", description: "Only JPG, PNG, WEBP allowed.", variant: "destructive" }); return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast({ title: "Error", description: "Max 5MB.", variant: "destructive" }); return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const q = parseInt(quantity);
    const p = parseFloat(price);
    if (!name.trim()) { toast({ title: "Error", description: "Name required", variant: "destructive" }); return; }
    if (!categoryId) { toast({ title: "Error", description: "Category required", variant: "destructive" }); return; }
    if (isNaN(q) || q < 0 || !Number.isInteger(q)) { toast({ title: "Error", description: "Quantity must be whole number ≥ 0", variant: "destructive" }); return; }
    if (isNaN(p) || p < 0) { toast({ title: "Error", description: "Price must be ≥ 0", variant: "destructive" }); return; }

    const err = editItem(itemId, { name, categoryId, quantity: q, price: p, image, notes: notes.trim() || undefined });
    if (err) { toast({ title: "Error", description: err, variant: "destructive" }); return; }
    toast({ title: "Item updated" });
    onClose();
  };

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div>
            <Label>Category *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Quantity *</Label><Input type="number" min="0" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} /></div>
            <div><Label>Price *</Label><Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} /></div>
          </div>
          <div>
            <Label>Image</Label>
            <div className="flex items-center gap-3 mt-1">
              {image ? (
                <div className="relative">
                  <img src={image} alt="Preview" className="h-16 w-16 rounded-lg object-cover border" />
                  <button type="button" onClick={() => { setImage(undefined); if (fileRef.current) fileRef.current.value = ""; }}
                    className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <ImagePlus className="h-5 w-5" />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImage} />
            </div>
          </div>
          <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
