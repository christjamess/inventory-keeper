import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, BarChart3, ShoppingCart } from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/summary", label: "Summary", icon: BarChart3 },
  { to: "/selling", label: "Selling", icon: ShoppingCart },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4">
          <span className="mr-4 text-lg font-bold text-primary">InvenTrack</span>
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`
              }
            >
              <l.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{l.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="mx-auto max-w-6xl p-4 md:p-6 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
