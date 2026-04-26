import { Link } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { useSimulation } from "@/lib/simulation-store";
import { motion, AnimatePresence } from "framer-motion";

export function SimulationBanner() {
  const { active, scenario } = useSimulation();
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Link
            to="/simulate"
            className="block w-full bg-destructive/90 text-destructive-foreground"
          >
            <div className="flex items-center justify-center gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-widest animate-pulse">
              <Activity className="h-4 w-4" />
              <span>Simulation in progress {scenario ? `— ${scenario}` : ""} — Click to view</span>
            </div>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
