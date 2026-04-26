import { Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Network, Play, ShieldCheck, BarChart3, History } from "lucide-react";

const items = [
  { url: "/", icon: LayoutDashboard, label: "Home" },
  { url: "/graph", icon: Network, label: "Graph" },
  { url: "/simulate", icon: Play, label: "Run" },
  { url: "/mitigation", icon: ShieldCheck, label: "Fix" },
  { url: "/analytics", icon: BarChart3, label: "Stats" },
  { url: "/history", icon: History, label: "Log" },
];

export function MobileTabBar() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl md:hidden">
      <ul className="flex items-center justify-around px-1 py-1.5">
        {items.map((it) => {
          const active = it.url === "/" ? pathname === "/" : pathname.startsWith(it.url);
          return (
            <li key={it.url}>
              <Link
                to={it.url}
                className={`flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <it.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
