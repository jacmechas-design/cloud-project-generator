import { Check, Pencil, Trash2, Undo2 } from "lucide-react";
import { priorityLabel, relativeTime, type Task, type Worker } from "@/lib/iglooo";

const priorityTone: Record<Task["priority"], string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning-soft text-warning",
  high: "bg-danger-soft text-danger",
};

export function TaskCard({
  task,
  workers,
  onToggle,
  onEdit,
  onDelete,
  onImageClick,
}: {
  task: Task;
  workers: Worker[];
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onImageClick: (url: string) => void;
}) {
  const assigned = workers.filter((w) => task.assigned_to.includes(w.id));
  const done = task.status === "completed";

  return (
    <article
      className={`task-card flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${
        done ? "opacity-70" : ""
      }`}
    >
      {task.image_url && (
        <button
          type="button"
          onClick={() => onImageClick(task.image_url!)}
          className="h-32 w-full overflow-hidden bg-muted"
        >
          <img
            src={task.image_url}
            alt={task.title}
            loading="lazy"
            className="h-32 w-full object-cover"
          />
        </button>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3
            className={`text-sm font-bold leading-snug ${done ? "text-muted-foreground line-through" : ""}`}
          >
            {task.title}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityTone[task.priority]}`}
          >
            {priorityLabel[task.priority]}
          </span>
        </div>

        {task.description && (
          <p className="line-clamp-3 text-xs text-muted-foreground">{task.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {assigned.length === 0 ? (
            <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Disponible para reclamar
            </span>
          ) : (
            assigned.map((w) => (
              <span
                key={w.id}
                className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-[11px] font-semibold"
              >
                <img src={w.avatar_url ?? ""} alt="" className="h-4 w-4 rounded-full" />
                {w.name}
              </span>
            ))
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <span className="text-[11px] font-medium text-muted-foreground">
            {relativeTime(task.created_at)}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onToggle(task)}
              title={done ? "Marcar como pendiente" : "Marcar completada"}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                done
                  ? "bg-muted text-muted-foreground hover:bg-secondary"
                  : "bg-success-soft text-success hover:brightness-95"
              }`}
            >
              {done ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={() => onEdit(task)}
              title="Editar"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition hover:bg-secondary"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task)}
              title="Eliminar"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-soft text-danger transition hover:brightness-95"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
