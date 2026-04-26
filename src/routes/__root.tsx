import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-2xl p-10 text-center">
        <h1 className="text-7xl font-bold text-gradient-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Sector not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The grid coordinates you requested don't exist on this network.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "UrbanSim — Urban Infrastructure Failure Chain Simulator" },
      {
        name: "description",
        content:
          "Simulate cascading infrastructure failures across smart city networks and test mitigation strategies.",
      },
      { property: "og:title", content: "UrbanSim — Urban Infrastructure Failure Chain Simulator" },
      { name: "twitter:title", content: "UrbanSim — Urban Infrastructure Failure Chain Simulator" },
      { name: "description", content: "UrbanSim simulates urban infrastructure failures and their cascading effects in smart cities." },
      { property: "og:description", content: "UrbanSim simulates urban infrastructure failures and their cascading effects in smart cities." },
      { name: "twitter:description", content: "UrbanSim simulates urban infrastructure failures and their cascading effects in smart cities." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e2678f03-eb88-4cc4-aaf8-6a7b1750974c/id-preview-26429268--e73305f5-6df6-465a-a4b6-5b535171d6a4.lovable.app-1777226774500.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e2678f03-eb88-4cc4-aaf8-6a7b1750974c/id-preview-26429268--e73305f5-6df6-465a-a4b6-5b535171d6a4.lovable.app-1777226774500.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <TopBar />
          <main className="flex-1 p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
