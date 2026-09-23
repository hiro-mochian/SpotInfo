import { requireSupabase } from "./supabase";
import type { CreateSpotInput, UpdateSpotInput } from "./validation";
import type { Spot } from "./spots";

const PAGE_SIZE = 1000;

function asSpot(value: unknown): Spot {
  const row = value as Record<string, unknown>;
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    area: String(row.area ?? ""),
    category: String(row.category ?? ""),
    note: String(row.note ?? ""),
    lat: Number(row.lat),
    lng: Number(row.lng),
    created_at: String(row.created_at ?? ""),
  };
}

async function rpc<T>(name: string, params?: Record<string, unknown>): Promise<T> {
  const { data, error } = await requireSupabase().rpc(name, params);
  if (error) throw new Error(error.message);
  return data as T;
}

export const spotKeys = {
  all: ["spots"] as const,
  public: ["spots", "public"] as const,
  count: ["spots", "count"] as const,
  mine: ["spots", "mine"] as const,
};

export async function listPublicSpots(): Promise<Spot[]> {
  const all: Spot[] = [];
  let offset = 0;
  while (true) {
    const page = await rpc<unknown[]>("list_spots", { p_limit: PAGE_SIZE, p_offset: offset });
    const rows = (page ?? []).map(asSpot);
    all.push(...rows);
    if (rows.length < PAGE_SIZE) return all;
    offset += PAGE_SIZE;
  }
}

export async function countPublicSpots(): Promise<number> {
  return Number(await rpc<number>("count_spots"));
}

export async function listMySpots(): Promise<Spot[]> {
  const rows = await rpc<unknown[]>("my_spots");
  return (rows ?? []).map(asSpot);
}

export async function createSpot(input: CreateSpotInput): Promise<number> {
  return Number(
    await rpc<number>("create_spot", {
      p_name: input.name,
      p_area: input.area,
      p_category: input.category,
      p_note: input.note,
      p_lat: input.lat,
      p_lng: input.lng,
    }),
  );
}

export async function updateSpot(input: UpdateSpotInput): Promise<boolean> {
  return rpc<boolean>("update_spot", {
    p_id: input.id,
    p_name: input.name,
    p_area: input.area,
    p_category: input.category,
    p_note: input.note,
  });
}

export async function deleteSpot(id: number): Promise<boolean> {
  return rpc<boolean>("delete_spot", { p_id: id });
}
