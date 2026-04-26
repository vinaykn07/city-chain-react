import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Play, Zap, Droplets, Wifi, Bus, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/simulate")({
  head: () => ({
    meta: [
      { title: "Run Simulation — UrbanSim" },
      { name: "description", content: "Configure and launch cascading failure simulations across city infrastructure." },
    ],
  }),
  component: SimulatePage,
});

function SimulatePage() {
  const [intensity, setIntensity] = useState([60]);
  const [duration, setDuration] = useState([30]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Run Simulation"
        description="Inject a failure event and observe how it propagates through the network."
        icon={Play}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="glass border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Scenario Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Initial Failure Point</Label>
                <Select defaultValue="pwr-2">
                  <SelectTrigger className="bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pwr-2">Substation PWR-2</SelectItem>
                    <SelectItem value="wtr-2">Water Pump WTR-2</SelectItem>
                    <SelectItem value="tel-1">Telecom Hub TEL-1</SelectItem>
                    <SelectItem value="trn-1">Transit Hub TRN-1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trigger Type</Label>
                <Select defaultValue="cyber">
                  <SelectTrigger className="bg-secondary/50 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cyber">Cyber Attack</SelectItem>
                    <SelectItem value="weather">Severe Weather</SelectItem>
                    <SelectItem value="overload">Demand Overload</SelectItem>
                    <SelectItem value="hardware">Hardware Failure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Failure Intensity</Label>
                <span className="font-mono text-sm text-primary">{intensity[0]}%</span>
              </div>
              <Slider value={intensity} onValueChange={setIntensity} max={100} step={5} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Simulation Duration</Label>
                <span className="font-mono text-sm text-primary">{duration[0]} min</span>
              </div>
              <Slider value={duration} onValueChange={setDuration} max={120} step={5} />
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
              <h4 className="text-sm font-semibold">Affected Subsystems</h4>
              {[
                { name: "Power Grid", icon: Zap, on: true },
                { name: "Water Network", icon: Droplets, on: true },
                { name: "Telecom", icon: Wifi, on: true },
                { name: "Transit", icon: Bus, on: false },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <s.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm">{s.name}</span>
                  </div>
                  <Switch defaultChecked={s.on} />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button className="flex-1 bg-gradient-to-r from-primary to-primary-glow shadow-[var(--shadow-glow)] text-primary-foreground hover:opacity-90" size="lg">
                <Play className="h-4 w-4" /> Launch Simulation
              </Button>
              <Button variant="outline" size="lg" className="border-border">
                Save Scenario
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="glass border-primary/30 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">AI Estimate</span>
              </div>
              <p className="mt-3 text-3xl font-bold">~14 nodes</p>
              <p className="text-sm text-muted-foreground">predicted to be impacted</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardContent className="p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Scenarios</h3>
              <div className="space-y-2 text-sm">
                {["Heat wave 2024", "DDoS on TEL-2", "Pump WTR-2 failure"].map((s) => (
                  <div key={s} className="flex items-center justify-between rounded-md border border-border bg-secondary/30 px-3 py-2 hover:bg-secondary/60 cursor-pointer">
                    <span>{s}</span>
                    <Play className="h-3 w-3 text-primary" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
