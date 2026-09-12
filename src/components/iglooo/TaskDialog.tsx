import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SquarePlus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { priorityLabel, uploadTaskImage, type Priority, type Task, type Worker } from "@/lib/iglooo";

const priorities: Priority[] = ["low", "medium", "high"];

export function TaskDialog({
  open,
  onOpenChange,
  task,
  workers,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task: Task | null;
  workers: Worker[];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [imageUrl, setImageUrl] = useState("");
  const [assigned, setAssigned] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setPriority(task?.priority ?? "medium");
    setImageUrl(task?.image_url ?? "");
    setAssigned(task?.assigned_to ?? []);
  }, [open, task]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        image_url: imageUrl.trim() || null,
        assigned_to: assigned,
      };
      if (task) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("tasks").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(task ? "Tarea actualizada" : "Tarea creada");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadTaskImage(file);
      setImageUrl(url);
      toast.success("Imagen subida");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="custom-scrollbar max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
            <SquarePlus className="h-5 w-5 text-brand" />
            {task ? "Editar Tarea" : "Nueva Tarea"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider">
              Título de la Tarea *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ej: Mantenimiento de motor secundario"
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider">
              Descripción / Instrucciones
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Escribe detalles o notas adicionales para los operarios..."
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">
              Prioridad
            </label>
            <div className="grid grid-cols-3 gap-2">
              {priorities.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition ${
                    priority === p
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-border bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {priorityLabel[p]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider">
              Imagen / Referencia (Opcional)
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFile(f);
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted px-3 py-2 text-xs font-semibold transition hover:bg-secondary disabled:opacity-60"
              >
                <Upload className="h-3.5 w-3.5 text-brand" />
                {uploading ? "Subiendo..." : "Subir Foto"}
              </button>
              <span className="text-xs text-muted-foreground">o URL:</span>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://ejemplo.com/foto.jpg"
                className="flex-1 rounded-xl border border-border bg-muted px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {imageUrl && (
              <div className="relative mt-2 overflow-hidden rounded-2xl border border-border bg-muted">
                <img src={imageUrl} alt="Vista previa" className="h-36 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface/80 text-surface-foreground transition hover:bg-danger"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider">
              Asignar Operarios
            </label>
            <p className="mb-2 text-[11px] text-muted-foreground">
              Selecciona operarios o déjala sin marcar para que sea una tarea disponible para
              reclamar.
            </p>
            <div className="custom-scrollbar max-h-36 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-muted p-2">
              {workers.length === 0 && (
                <p className="py-3 text-center text-xs text-muted-foreground">
                  Agrega operarios desde "Gestionar Equipo".
                </p>
              )}
              {workers.map((w) => {
                const checked = assigned.includes(w.id);
                return (
                  <label
                    key={w.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
                      checked ? "bg-brand-soft text-brand" : "hover:bg-secondary"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setAssigned((prev) =>
                          checked ? prev.filter((id) => id !== w.id) : [...prev, w.id],
                        )
                      }
                      className="accent-[var(--brand)]"
                    />
                    <img src={w.avatar_url ?? ""} alt="" className="h-5 w-5 rounded-full bg-card" />
                    {w.name}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-muted-foreground transition hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-xl bg-brand px-5 py-2.5 text-xs font-bold text-brand-foreground shadow-md transition hover:brightness-110 disabled:opacity-60"
            >
              Guardar Tarea
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
