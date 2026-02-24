import { useState, useRef } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { PackagePlus, ImagePlus, X } from "lucide-react";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function AddItemForm() {
  const { categories, addItem } = useStore();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrors(p => ({ ...p, image: "Only JPG, PNG, WEBP allowed." })); return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setErrors(p => ({ ...p, image: "Max 5MB." })); return;
    }
    const reader = new FileReader();
    reader.onload = () => { setImage(reader.result as string); setErrors(p => { const { image: _, ...rest } = p; return rest; }); };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Required";
    if (!categoryId) e.categoryId = "Required";
    const q = parseInt(quantity);
    if (isNaN(q) || q < 0 || !Number.isInteger(q)) e.quantity = "Must be a whole number ≥ 0";
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) e.price = "Must be ≥ 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const err = await addItem({
      name: name.trim(),
      categoryId,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      image,
      notes: notes.trim() || undefined,
    });
    if (err) { toast({ title: "Error", description: err, variant: "destructive" }); return; }
    toast({ title: "Item added successfully!" });
    setName(""); setCategoryId(""); setQuantity(""); setPrice(""); setImage(undefined); setNotes("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <PackagePlus className="h-5 w-5 text-primary" /> Add Item
      </h2>
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Create a category first before adding items.</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="itemName">Item Name *</Label>
            <Input id="itemName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Blue T-Shirt" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>
          <div>
            <Label>Category *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-xs text-destructive mt-1">{errors.categoryId}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="qty">Quantity *</Label>
              <Input id="qty" type="number" min="0" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" />
              {errors.quantity && <p className="text-xs text-destructive mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <Label htmlFor="price">Price *</Label>
              <Input id="price" type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
              {errors.price && <p className="text-xs text-destructive mt-1">{errors.price}</p>}
            </div>
          </div>
          <div>
            <Label>Image (optional)</Label>
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
            {errors.image && <p className="text-xs text-destructive mt-1">{errors.image}</p>}
          </div>
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional info..." rows={2} />
          </div>
          <Button type="submit" className="w-full"><PackagePlus className="mr-2 h-4 w-4" /> Add Item</Button>
        </form>
      )}
    </div>
  );
}
