import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Brush, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export function EndOfDayDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();

  const clean = useMutation({
    mutationFn: async (mode: "completed" | "all") => {
      const query = supabase.from("tasks").delete();
      const { error } =
        mode === "completed"
          ? await query.eq("status", "completed")
          : await query.neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: (_d, mode) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(mode === "completed" ? "Tareas completadas borradas" : "Tablero reiniciado");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl text-center">
        <DialogHeader>
          <DialogTitle className="sr-only">Cierre de jornada</DialogTitle>
        </DialogHeader>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-warning-soft text-warning">
          <Brush className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-extrabold">Cierre de Turno / Jornada</h3>
        <p className="-mt-2 text-xs text-muted-foreground">
          Limpia el tablero para dejarlo preparado para el siguiente turno de trabajo.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            disabled={clean.isPending}
            onClick={() => clean.mutate("completed")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-3 text-xs font-bold transition hover:bg-success-soft hover:text-success"
          >
            <Check className="h-4 w-4 text-success" />
            Borrar solo tareas completadas
          </button>
          <button
            type="button"
            disabled={clean.isPending}
            onClick={() => clean.mutate("all")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-danger-soft px-4 py-3 text-xs font-bold text-danger transition hover:brightness-95"
          >
            <Trash2 className="h-4 w-4" />
            Borrar TODAS las tareas (Reset completo)
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
