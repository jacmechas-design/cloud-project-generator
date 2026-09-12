import { Layers, Hourglass, CircleCheck, TrendingUp } from "lucide-react";
import type { Task } from "@/lib/iglooo";

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>{icon}</div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-xl font-black">{value}</p>
      </div>
    </div>
  );
}

export function StatsBar({ tasks }: { tasks: Task[] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const pending = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      <StatCard
        icon={<Layers className="h-5 w-5" />}
        label="Tareas Totales"
        value={String(total)}
        tone="bg-brand-soft text-brand"
      />
      <StatCard
        icon={<Hourglass className="h-5 w-5" />}
        label="Pendientes"
        value={String(pending)}
        tone="bg-warning-soft text-warning"
      />
      <StatCard
        icon={<CircleCheck className="h-5 w-5" />}
        label="Completadas"
        value={String(completed)}
        tone="bg-success-soft text-success"
      />
      <StatCard
        icon={<TrendingUp className="h-5 w-5" />}
        label="Avance Global"
        value={`${percent}%`}
        tone="bg-info-soft text-info"
      />
    </div>
  );
}
