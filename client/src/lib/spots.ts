export type Spot = {
  id: number;
  name: string;
  area: string;
  category: string;
  note: string;
  lat: number;
  lng: number;
  created_at: string;
};

export function inTokyoView(lat: number, lng: number): boolean {
  return lat > 35.5 && lat < 35.9 && lng > 139.4 && lng < 140;
}

export function categoriesFor(spots: Spot[]): string[] {
  return Array.from(new Set(spots.map((spot) => spot.category).filter(Boolean)));
}

export function filterAndSortSpots(spots: Spot[], category: string, query: string): Spot[] {
  const needle = query.trim().toLocaleLowerCase();
  return spots
    .filter((spot) => category === "all" || spot.category === category)
    .filter((spot) => {
      if (!needle) return true;
      return `${spot.name}${spot.area}${spot.category}${spot.note}`.toLocaleLowerCase().includes(needle);
    })
    .slice()
    .sort((a, b) => Number(!inTokyoView(a.lat, a.lng)) - Number(!inTokyoView(b.lat, b.lng)));
}
