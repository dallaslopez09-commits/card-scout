import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { LayoutDashboard, Search, Layers, Star, Scan, LogOut, Loader2, Tag, Trophy, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Search", href: "/search", icon: Search },
    { label: "Collection", href: "/collection", icon: Layers },
    { label: "Wishlist", href: "/wishlist", icon: Star },
    { label: "AI Scan", href: "/scan", icon: Scan },
    { label: "Deal Finder", href: "/deals", icon: Tag },
    { label: "Sets", href: "/sets", icon: Trophy },
    { label: "Insurance", href: "/insurance", icon: ShieldCheck },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded shadow-sm flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">L&L</span>
            </div>
            <span className="font-bold text-sm tracking-tight leading-tight">L&L Gonzo Grader</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-medium transition-colors duration-150 ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                <item.icon className={`w-4 h-4 ${isActive ? "text-primary-foreground" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate">{user?.firstName || "Collector"}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.email || "No email"}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => logout()} title="Logout" className="text-muted-foreground hover:text-destructive shrink-0">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile Header */}
        <header className="h-16 border-b border-border bg-card flex items-center px-4 md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded shadow-sm flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">L&L</span>
            </div>
            <span className="font-bold text-sm tracking-tight leading-tight">L&L Gonzo Grader</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-background p-4 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </div>
        
        {/* Mobile Nav */}
        <nav className="h-16 border-t border-border bg-card flex items-center justify-around px-2 md:hidden shrink-0 pb-safe">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 p-2 rounded-sm transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
