import { supabase } from "@/integrations/supabase/client";

export type Priority = "low" | "medium" | "high";
export type Status = "pending" | "completed";

export type Worker = {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  image_url: string | null;
  assigned_to: string[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export const workersQuery = {
  queryKey: ["workers"] as const,
  queryFn: async (): Promise<Worker[]> => {
    const { data, error } = await supabase
      .from("workers")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Worker[];
  },
};

export const tasksQuery = {
  queryKey: ["tasks"] as const,
  queryFn: async (): Promise<Task[]> => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Task[];
  },
};

export function avatarFor(name: string) {
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
}

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export async function uploadTaskImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("task-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: signError } = await supabase.storage
    .from("task-images")
    .createSignedUrl(path, TEN_YEARS);
  if (signError) throw signError;
  return data.signedUrl;
}

export const priorityLabel: Record<Priority, string> = {
  low: "Baja",
  medium: "Normal",
  high: "Alta",
};

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "hace un momento";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} d`;
}
