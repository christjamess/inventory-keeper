import CategoryManager from "@/components/CategoryManager";
import AddItemForm from "@/components/AddItemForm";

export default function Dashboard() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <CategoryManager />
        <AddItemForm />
      </div>
    </div>
  );
}
