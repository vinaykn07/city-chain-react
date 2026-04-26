import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, Power, Recycle, Network, Battery } from "lucide-react";

export const Route = createFileRoute("/mitigation")({
  head: () => ({
    meta: [
      { title: "Mitigation Strategies — UrbanSim" },
      { name: "description", content: "Library of pre-configured response playbooks to contain cascading infrastructure failures." },
    ],
  }),
  component: MitigationPage,
});

const strategies = [
  { name: "Load Shedding", icon: Power, desc: "Selectively disconnect non-critical loads to preserve grid frequency.", impact: "High", risk: "Low", time: "30s" },
  { name: "Network Rerouting", icon: Network, desc: "Redirect telecom traffic through redundant fiber paths.", impact: "Medium", risk: "Low", time: "2m" },
  { name: "Battery Failover", icon: Battery, desc: "Engage distributed energy storage to bridge outages.", impact: "High", risk: "Medium", time: "45s" },
  { name: "Service Throttle", icon: Recycle, desc: "Reduce water pressure across non-essential districts.", impact: "Medium", risk: "Low", time: "1m" },
  { name: "Isolation Protocol", icon: ShieldAlert, desc: "Quarantine affected segment to halt propagation.", impact: "Critical", risk: "High", time: "15s" },
  { name: "Manual Override", icon: ShieldCheck, desc: "Hand control to on-site operations team.", impact: "Variable", risk: "Medium", time: "5m" },
];

const tone = (v: string) =>
  v === "Critical" || v === "High" ? "destructive" :
  v === "Medium" ? "warning" : "success";

function MitigationPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Mitigation Strategies"
        description="Battle-tested playbooks ready to deploy when failure cascades begin."
        icon={ShieldCheck}
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {strategies.map((s) => (
          <Card key={s.name} className="glass border-border/50 group hover:border-primary/40 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="rounded-lg bg-primary/15 border border-primary/30 p-2.5 group-hover:shadow-[var(--shadow-glow)] transition-shadow">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="outline" className="border-border text-xs font-mono">{s.time}</Badge>
              </div>

              <h3 className="mt-4 text-lg font-semibold">{s.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className={`bg-${tone(s.impact)}/15 text-${tone(s.impact)} border-${tone(s.impact)}/30`}>
                  Impact: {s.impact}
                </Badge>
                <Badge className={`bg-${tone(s.risk)}/15 text-${tone(s.risk)} border-${tone(s.risk)}/30`}>
                  Risk: {s.risk}
                </Badge>
              </div>

              <Button variant="outline" className="mt-4 w-full border-border hover:bg-primary/10 hover:border-primary/50 hover:text-primary">
                Deploy Strategy
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
