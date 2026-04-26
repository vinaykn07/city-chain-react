import { useEffect, useState } from "react";

type Listener = () => void;

class SimStore {
  active = false;
  scenario = "";
  listeners = new Set<Listener>();

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  emit() {
    this.listeners.forEach((l) => l());
  }

  start(scenario: string) {
    this.active = true;
    this.scenario = scenario;
    this.emit();
  }

  stop() {
    this.active = false;
    this.scenario = "";
    this.emit();
  }
}

export const simStore = new SimStore();

export function useSimulation() {
  const [, setTick] = useState(0);
  useEffect(() => simStore.subscribe(() => setTick((t) => t + 1)), []);
  return { active: simStore.active, scenario: simStore.scenario, start: simStore.start.bind(simStore), stop: simStore.stop.bind(simStore) };
}
