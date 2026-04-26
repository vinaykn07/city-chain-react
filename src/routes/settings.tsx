import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — UrbanSim" },
      { name: "description", content: "Configure simulation defaults, alert thresholds, and integrations." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Settings"
        description="System preferences, integrations, and operator details."
        icon={SettingsIcon}
      />

      <div className="space-y-6">
        <Card className="glass border-border/50">
          <CardHeader><CardTitle className="text-base">Operator Profile</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Operator name</Label>
              <Input defaultValue="J. Reyes" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="ops@urbansim.city" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input defaultValue="Metropolis Bay" className="bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label>Time zone</Label>
              <Select defaultValue="utc">
                <SelectTrigger className="bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="utc">UTC</SelectItem>
                  <SelectItem value="pst">Pacific (PST)</SelectItem>
                  <SelectItem value="est">Eastern (EST)</SelectItem>
                  <SelectItem value="cet">Central European (CET)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader><CardTitle className="text-base">Simulation Defaults</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Auto-deploy mitigation playbooks", desc: "Engage low-risk strategies without confirmation.", on: true },
              { label: "Real-time propagation animation", desc: "Visualize cascade in the graph view.", on: true },
              { label: "Verbose telemetry logging", desc: "Capture all node-level state changes.", on: false },
              { label: "Email alerts on critical failures", desc: "Notify operators when severity = critical.", on: true },
            ].map((s) => (
              <div key={s.label} className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{s.label}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
                <Switch defaultChecked={s.on} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass border-border/50">
          <CardHeader><CardTitle className="text-base">Danger Zone</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium">Reset all simulation history</p>
              <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
            </div>
            <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10">
              Reset history
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" className="border-border">Cancel</Button>
          <Button className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-glow)]">Save changes</Button>
        </div>
      </div>
    </div>
  );
}
