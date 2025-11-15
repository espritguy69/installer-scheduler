import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Home, Upload, FileText, Users, Calendar, BarChart3, StickyNote, History, Settings } from "lucide-react";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const allNavItems = [
    { href: "/", label: "Home", icon: Home, roles: ["admin", "supervisor", "user"] },
    { href: "/installer", label: "My Tasks", icon: Users, roles: ["user"] },
    { href: "/dashboard", label: "Dashboard", icon: BarChart3, roles: ["admin", "supervisor"] },
    { href: "/performance", label: "Performance", icon: BarChart3, roles: ["admin", "supervisor"] },
    { href: "/orders", label: "Orders", icon: FileText, roles: ["admin", "supervisor"] },
    { href: "/schedule", label: "Schedule", icon: Calendar, roles: ["admin", "supervisor"] },
    { href: "/notes", label: "Notes", icon: StickyNote, roles: ["admin", "supervisor"] },
    { href: "/history", label: "History", icon: History, roles: ["admin", "supervisor"] },
    { href: "/upload", label: "Upload", icon: Upload, roles: ["admin", "supervisor"] },
    { href: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
  ];

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold hover:text-primary transition-colors">
            {APP_TITLE}
          </Link>
          <div className="hidden md:flex gap-1">
            {navItems.map(({ href, label, icon: Icon, roles }) => (
              <Link key={href} href={href}>
                <Button
                  variant={isActive(href) ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.name}
              </span>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Sign Out
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
