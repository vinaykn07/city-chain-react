import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus, Grid3x3 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/60 px-4 backdrop-blur-xl">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

      <Link to="/" className="flex items-center gap-2">
        <Grid3x3 className="h-5 w-5 text-primary" />
        <span className="text-sm font-bold tracking-tight text-gradient-primary">
          UrbanSim
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-xs font-medium text-success">System Ready</span>
        </div>

        <Button asChild size="sm" className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-90">
          <Link to="/simulate">
            <Plus className="h-4 w-4" />
            New Simulation
          </Link>
        </Button>
      </div>
    </header>
  );
}
