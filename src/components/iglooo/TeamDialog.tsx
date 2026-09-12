import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { avatarFor, type Worker } from "@/lib/iglooo";

export function TeamDialog({
  open,
  onOpenChange,
  workers,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workers: Worker[];
}) {
  const [name, setName] = useState("");
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["workers"] });
    qc.invalidateQueries({ queryKey: ["tasks"] });
  };

  const addWorker = useMutation({
    mutationFn: async (workerName: string) => {
      const { error } = await supabase
        .from("workers")
        .insert({ name: workerName, avatar_url: avatarFor(workerName) });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      invalidate();
      toast.success("Operario agregado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeWorker = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Operario eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
            <Users className="h-4 w-4 text-brand" /> Equipo de Operarios
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) addWorker.mutate(name.trim());
          }}
          className="flex gap-2"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Nombre del trabajador..."
            className="flex-1 rounded-xl border border-border bg-muted px-3.5 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-brand-foreground shadow-sm transition hover:brightness-110"
          >
            Agregar
          </button>
        </form>

        <div className="custom-scrollbar max-h-60 space-y-2 overflow-y-auto pr-1">
          {workers.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Aún no hay operarios registrados.
            </p>
          )}
          {workers.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between rounded-xl border border-border bg-muted px-3 py-2"
            >
              <span className="flex items-center gap-2 text-xs font-bold">
                <img src={w.avatar_url ?? ""} alt="" className="h-7 w-7 rounded-full bg-card" />
                {w.name}
              </span>
              <button
                type="button"
                onClick={() => removeWorker.mutate(w.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
