import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Network,
  Play,
  ShieldCheck,
  BarChart3,
  History,
  Settings,
  Grid3x3,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Infrastructure Graph", url: "/graph", icon: Network },
  { title: "Run Simulation", url: "/simulate", icon: Play },
  { title: "Mitigation Strategies", url: "/mitigation", icon: ShieldCheck },
  { title: "Analytics & Metrics", url: "/analytics", icon: BarChart3 },
  { title: "Simulation History", url: "/history", icon: History },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow shadow-[var(--shadow-glow)]">
            <Grid3x3 className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold tracking-tight text-gradient-primary">
                UrbanSim
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Smart City OS
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  item.url === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={
                        active
                          ? "bg-primary/15 text-primary font-medium border border-primary/30 shadow-[0_0_20px_-8px_var(--color-primary)]"
                          : "hover:bg-sidebar-accent/60"
                      }
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
