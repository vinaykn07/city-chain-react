import { toast } from "sonner";

export const notify = {
  failure: (nodeName: string) =>
    toast.error(`${nodeName} has failed — cascade initiated`, {
      style: {
        background: "oklch(0.30 0.10 25)",
        border: "1px solid oklch(0.65 0.22 25 / 0.6)",
        color: "oklch(0.97 0.01 240)",
      },
    }),
  mitigation: (msg = "Mitigation strategy deployed successfully") =>
    toast.success(msg, {
      style: {
        background: "oklch(0.28 0.08 145)",
        border: "1px solid oklch(0.72 0.18 145 / 0.6)",
        color: "oklch(0.97 0.01 240)",
      },
    }),
  warning: (nodeName: string) =>
    toast(`System degradation detected in ${nodeName}`, {
      style: {
        background: "oklch(0.30 0.08 75)",
        border: "1px solid oklch(0.78 0.16 75 / 0.6)",
        color: "oklch(0.97 0.01 240)",
      },
    }),
  info: (msg: string) => toast(msg),
};
