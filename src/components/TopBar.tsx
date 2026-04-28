import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Grid3x3, LogOut } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/auth";

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/60 px-4 backdrop-blur-xl">
      <SidebarTrigger className="hidden md:inline-flex text-muted-foreground hover:text-foreground" />

      <Link to="/" className="flex items-center gap-2">
        <Grid3x3 className="h-5 w-5 text-primary" />
        <span className="text-sm font-bold tracking-tight text-gradient-primary">UrbanSim</span>
      </Link>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-xs font-medium text-success">System Ready</span>
        </div>

        {user && (
          <div className="flex items-center gap-2 rounded-full border border-border bg-card/50 py-1 pl-1 pr-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-[11px] font-semibold text-primary-foreground">
              {user.avatar}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-xs font-medium">{user.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {user.role}
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={logout}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <ThemeToggle />

        <Button
          asChild
          size="sm"
          className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-glow)] transition-transform hover:opacity-90 hover:scale-[1.02] active:scale-95"
        >
          <Link to="/simulate">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Simulation</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
