import { collection, doc, getCountFromServer, getDoc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { requireAuth, requireDb } from "./firebase";
import type { Spot } from "./spots";
import type { CreateSpotInput, UpdateSpotInput } from "./validation";

export const spotKeys = {
  all: ["spots"] as const,
  public: ["spots", "public"] as const,
  count: ["spots", "count"] as const,
  mine: ["spots", "mine"] as const,
};

function asSpot(id: string, fields: Record<string, unknown>): Spot {
  const created = fields.createdAt as { toDate?: () => Date } | undefined;
  return {
    id,
    name: String(fields.name ?? ""),
    area: String(fields.area ?? ""),
    category: String(fields.category ?? ""),
    note: String(fields.note ?? ""),
    lat: Number(fields.lat),
    lng: Number(fields.lng),
    created_at: created?.toDate?.().toISOString() ?? "",
  };
}

function currentUid(): string {
  const user = requireAuth().currentUser;
  if (!user) throw new Error("Google でログインしてから操作してください。");
  return user.uid;
}

export async function listPublicSpots(): Promise<Spot[]> {
  const snapshot = await getDocs(collection(requireDb(), "spots"));
  return snapshot.docs.map((item) => asSpot(item.id, item.data()));
}

export async function countPublicSpots(): Promise<number> {
  const count = await getCountFromServer(collection(requireDb(), "spots"));
  return count.data().count;
}

export async function listMySpots(): Promise<Spot[]> {
  const database = requireDb();
  const uid = currentUid();
  const owners = await getDocs(query(collection(database, "spotOwners"), where("uid", "==", uid)));
  const records = await Promise.all(owners.docs.map(async (owner) => {
    const publicRecord = await getDoc(doc(database, "spots", owner.id));
    return publicRecord.exists() ? asSpot(publicRecord.id, publicRecord.data()) : null;
  }));
  return records.filter((record): record is Spot => record !== null);
}

export async function createSpot(input: CreateSpotInput): Promise<string> {
  const database = requireDb();
  const uid = currentUid();
  const spot = doc(collection(database, "spots"));
  const owner = doc(database, "spotOwners", spot.id);
  const batch = writeBatch(database);
  batch.set(spot, {
    name: input.name,
    area: input.area,
    category: input.category,
    note: input.note,
    lat: input.lat,
    lng: input.lng,
    createdAt: serverTimestamp(),
  });
  batch.set(owner, { uid });
  await batch.commit();
  return spot.id;
}

export async function updateSpot(input: UpdateSpotInput): Promise<boolean> {
  await updateDoc(doc(requireDb(), "spots", input.id), {
    name: input.name,
    area: input.area,
    category: input.category,
    note: input.note,
  });
  return true;
}

export async function deleteSpot(id: string): Promise<boolean> {
  const database = requireDb();
  const batch = writeBatch(database);
  batch.delete(doc(database, "spots", id));
  batch.delete(doc(database, "spotOwners", id));
  await batch.commit();
  return true;
}

export async function adminSummary(): Promise<{ role: string; spot_count: number; unassigned_legacy_count: number }> {
  const database = requireDb();
  const [spots, unassigned] = await Promise.all([
    getCountFromServer(collection(database, "spots")),
    getCountFromServer(query(collection(database, "spotOwners"), where("uid", "==", null))),
  ]);
  return {
    role: "admin",
    spot_count: spots.data().count,
    unassigned_legacy_count: unassigned.data().count,
  };
}
