import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, FolderOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function CategoryManager() {
  const { categories, addCategory, editCategory, deleteCategory } = useStore();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = async () => {
    const err = await addCategory(newName);
    if (err) { toast({ title: "Error", description: err, variant: "destructive" }); return; }
    setNewName("");
    toast({ title: "Category added" });
  };

  const handleEdit = async (id: string) => {
    const err = await editCategory(id, editName);
    if (err) { toast({ title: "Error", description: err, variant: "destructive" }); return; }
    setEditingId(null);
    toast({ title: "Category updated" });
  };

  const handleDelete = async (id: string) => {
    const err = await deleteCategory(id);
    if (err) { toast({ title: "Error", description: err, variant: "destructive" }); return; }
    toast({ title: "Category deleted" });
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <FolderOpen className="h-5 w-5 text-primary" /> Categories
      </h2>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="New category name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <Button onClick={handleAdd} size="sm"><Plus className="mr-1 h-4 w-4" /> Add</Button>
      </div>
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No categories yet. Add one above.</p>
      ) : (
        <ul className="space-y-1.5 max-h-64 overflow-y-auto">
          {categories.map(c => (
            <li key={c.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
              {editingId === c.id ? (
                <>
                  <Input
                    className="h-8 flex-1"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleEdit(c.id)}
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(c.id)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{c.name}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingId(c.id); setEditName(c.name); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{c.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(c.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
