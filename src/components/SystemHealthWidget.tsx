import { useSidebar } from "@/components/ui/sidebar";

export function SystemHealthWidget() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const operational = 16;
  const degraded = 5;
  const failed = 3;
  const total = operational + degraded + failed;
  const score = Math.round((operational / total) * 100);

  // Donut math
  const r = 22;
  const c = 2 * Math.PI * r;
  const opSeg = (operational / total) * c;
  const degSeg = (degraded / total) * c;
  const failSeg = (failed / total) * c;

  if (collapsed) {
    return (
      <div className="flex items-center justify-center px-2 py-3" title={`Health ${score}%`}>
        <Donut r={r} c={c} opSeg={opSeg} degSeg={degSeg} failSeg={failSeg} score={score} small />
      </div>
    );
  }

  return (
    <div className="m-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          System Health
        </span>
        <span className="text-xs font-bold text-success">{score}%</span>
      </div>
      <div className="flex items-center gap-3">
        <Donut r={r} c={c} opSeg={opSeg} degSeg={degSeg} failSeg={failSeg} score={score} />
        <ul className="flex-1 space-y-1 text-[11px]">
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Operational</span>
            <span className="font-mono tabular-nums text-foreground">{operational}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-warning" /> Degraded</span>
            <span className="font-mono tabular-nums text-foreground">{degraded}</span>
          </li>
          <li className="flex items-center justify-between">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-destructive pulse-dot" /> Failed</span>
            <span className="font-mono tabular-nums text-foreground">{failed}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function Donut({ r, c, opSeg, degSeg, failSeg, score, small }: {
  r: number; c: number; opSeg: number; degSeg: number; failSeg: number; score: number; small?: boolean;
}) {
  const size = small ? 36 : 60;
  const sw = small ? 5 : 8;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" className="-rotate-90">
      <circle cx="30" cy="30" r={r} fill="none" stroke="oklch(0.28 0.03 256)" strokeWidth={sw} />
      <circle cx="30" cy="30" r={r} fill="none" stroke="oklch(0.72 0.18 145)" strokeWidth={sw}
        strokeDasharray={`${opSeg} ${c}`} strokeDashoffset="0" />
      <circle cx="30" cy="30" r={r} fill="none" stroke="oklch(0.78 0.16 75)" strokeWidth={sw}
        strokeDasharray={`${degSeg} ${c}`} strokeDashoffset={-opSeg} />
      <circle cx="30" cy="30" r={r} fill="none" stroke="oklch(0.65 0.22 25)" strokeWidth={sw}
        strokeDasharray={`${failSeg} ${c}`} strokeDashoffset={-(opSeg + degSeg)} />
      {!small && (
        <text x="30" y="34" textAnchor="middle" fontSize="11" fontWeight="700"
          className="fill-foreground rotate-90" style={{ transformOrigin: "30px 30px" }}>
          {score}
        </text>
      )}
    </svg>
  );
}
