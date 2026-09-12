import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Cloud, Filter, Plus, ShieldUser, UsersRound, Brush, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { tasksQuery, workersQuery, type Task } from "@/lib/iglooo";
import { StatsBar } from "@/components/iglooo/StatsBar";
import { TaskCard } from "@/components/iglooo/TaskCard";
import { TaskDialog } from "@/components/iglooo/TaskDialog";
import { TeamDialog } from "@/components/iglooo/TeamDialog";
import { EndOfDayDialog } from "@/components/iglooo/EndOfDayDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Iglooo Task — Panel de Administración de Tareas" },
      {
        name: "description",
        content:
          "Crea, asigna y supervisa las tareas de tu equipo de operarios en tiempo real desde un solo tablero.",
      },
      { property: "og:title", content: "Iglooo Task — Panel de Administración" },
      {
        property: "og:description",
        content: "Gestión y asignación de tareas para equipos de operarios, en tiempo real.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPanel,
});

function AdminPanel() {
  const qc = useQueryClient();
  const { data: tasks = [] } = useQuery(tasksQuery);
  const { data: workers = [] } = useQuery(workersQuery);

  const [filterWorker, setFilterWorker] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [taskDialog, setTaskDialog] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [teamDialog, setTeamDialog] = useState(false);
  const [eodDialog, setEodDialog] = useState(false);
  const [toDelete, setToDelete] = useState<Task | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("iglooo-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        qc.invalidateQueries({ queryKey: ["tasks"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "workers" }, () => {
        qc.invalidateQueries({ queryKey: ["workers"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const toggle = useMutation({
    mutationFn: async (task: Task) => {
      const completed = task.status !== "completed";
      const { error } = await supabase
        .from("tasks")
        .update({
          status: completed ? "completed" : "pending",
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (task: Task) => {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea eliminada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        const okWorker = filterWorker === "all" || t.assigned_to.includes(filterWorker);
        const okStatus = filterStatus === "all" || t.status === filterStatus;
        return okWorker && okStatus;
      }),
    [tasks, filterWorker, filterStatus],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 bg-surface text-surface-foreground shadow-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-lg">
              <ShieldUser className="h-5 w-5" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-base font-bold leading-tight sm:text-lg">
                Iglooo Task
                <span className="rounded-full border border-brand/40 bg-brand/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                  Panel Admin
                </span>
              </h1>
              <p className="text-xs font-medium opacity-70">Gestión y Asignación de Tareas</p>
            </div>
          </div>

          <span className="flex items-center gap-1.5 rounded-full border border-success/40 bg-success/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
            <Cloud className="h-3 w-3" /> Nube conectada
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <StatsBar tasks={tasks} />

        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Filtrar:
            </span>
            <select
              value={filterWorker}
              onChange={(e) => setFilterWorker(e.target.value)}
              className="rounded-xl border border-border bg-muted px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Todos los operarios</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-border bg-muted px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTeamDialog(true)}
              className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3.5 py-2 text-xs font-bold transition hover:bg-secondary"
            >
              <UsersRound className="h-3.5 w-3.5 text-muted-foreground" /> Gestionar Equipo
            </button>
            <button
              type="button"
              onClick={() => setEodDialog(true)}
              className="flex items-center gap-2 rounded-xl bg-warning-soft px-3.5 py-2 text-xs font-bold text-warning transition hover:brightness-95"
            >
              <Brush className="h-3.5 w-3.5" /> Cierre de Jornada
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setTaskDialog(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-brand-foreground shadow-md transition hover:brightness-110 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" /> Nueva Tarea
            </button>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Listado General de Tareas
            </h2>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold">
              {filtered.length}
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border bg-card p-8 py-16 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
                <ClipboardCheck className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold">No hay tareas registradas</h3>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                Haz clic en "Nueva Tarea" para crear trabajo e indicarle a tu equipo qué realizar
                hoy.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  workers={workers}
                  onToggle={(t) => toggle.mutate(t)}
                  onEdit={(t) => {
                    setEditing(t);
                    setTaskDialog(true);
                  }}
                  onDelete={setToDelete}
                  onImageClick={setLightbox}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <TaskDialog open={taskDialog} onOpenChange={setTaskDialog} task={editing} workers={workers} />
      <TeamDialog open={teamDialog} onOpenChange={setTeamDialog} workers={workers} />
      <EndOfDayDialog open={eodDialog} onOpenChange={setEodDialog} />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.title}" se borrará del tablero. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) remove.mutate(toDelete);
                setToDelete(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {lightbox && (
        <div
          role="presentation"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-surface/90 p-4 backdrop-blur-md"
        >
          <button
            type="button"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/20 text-surface-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightbox}
            alt="Imagen de la tarea"
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
