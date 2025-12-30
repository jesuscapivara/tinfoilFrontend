import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard", admin: false },
    { label: "Downloads", href: "/downloads", admin: true },
    { label: "Games", href: "/games", admin: true },
  ];

  const filteredItems = navItems.filter((item) => !item.admin || user?.role === "admin");

  return (
    <nav className="border-b-2 border-primary bg-card/90 backdrop-blur sticky top-0 z-50">
      <div className="container py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/dashboard" className="text-2xl font-bold text-primary uppercase tracking-widest hover:text-secondary transition-colors">
            ▲ TINFOIL ▼
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-bold text-foreground uppercase hover:text-primary transition-colors tracking-wider"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-foreground font-mono font-bold">{user?.email}</p>
              <p className="text-xs text-secondary font-mono mt-1">
                {user?.role === "admin" ? "● ADMIN" : "● USER"}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => logout()}
              className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all"
            >
              <LogOut className="w-4 h-4" />
            </Button>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden border-2 border-primary p-2 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t-2 border-primary/50 space-y-3">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-sm font-bold text-foreground uppercase hover:text-primary transition-colors p-3 border border-primary/50 hover:border-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
