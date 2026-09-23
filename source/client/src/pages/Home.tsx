import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const TOKYO_CENTER = { lat: 35.6812, lng: 139.7671 };

const copy = {
  ja: {
    brand: "Spot",
    explore: "見つける",
    save: "残す",
    connect: "つなぐ",
    login: "ログイン",
    logout: "ログアウト",
    join: "登録",
    eyebrow: "Local knowledge, shared openly",
    heroTitle: "あなたの「ここ、いいよ」を",
    heroTitleLine: "地図に残そう。",
    heroBody:
      "誰でも見つけて、誰でも書き込める。旅先の小さな発見から、暮らしの中の頼れる場所まで、みんなで育てるオープンなスポット地図です。",
    openAtlas: "地図帳をひらく",
    leaveSpot: "新しいスポットを残す",
    honestCount: (n: number) => `公開 ${n}件 · 誰でも残せる`,
    mapTitle: "いま、みんなが残した場所",
    searchLabel: "地図上の地名・施設を検索",
    searchPlaceholder: "例：浅草寺、東京国立博物館、渋谷",
    searchButton: "地図で探す",
    listTitle: "スポット一覧",
    filterPlaceholder: "場所・エリア・カテゴリーで検索",
    all: "すべて",
    outOfMap: "地図の外",
    inMap: "範囲内",
    howTitle: "見つける人と、残す人が、同じ地図を育てる。",
    howFind: "見つける",
    howFindBody: "地図と一覧から、気になる場所を探す。",
    howSave: "残す",
    howSaveBody: "場所をクリックして、説明やメモを登録する。",
    howConnect: "つなぐ",
    howConnectBody: "次の誰かの旅や暮らしのヒントになる。",
    footer: "Spot は、身近な発見を静かに共有するためのオープンな場所です。",
    year: "2026 / open to all",
    formTitle: "新しいスポットを残す",
    formBody: "地図をクリックすると、位置が入ります。",
    name: "スポット名",
    area: "エリア",
    category: "カテゴリー",
    note: "ひとこと",
    saveAction: "この場所を残す",
    cancel: "閉じる",
    registered: "スポットを残しました。",
    empty: "該当するスポットはありません。",
    mine: "マイスポット",
  },
  en: {
    brand: "Spot",
    explore: "Find",
    save: "Leave",
    connect: "Connect",
    login: "Log in",
    logout: "Log out",
    join: "Join",
    eyebrow: "Local knowledge, shared openly",
    heroTitle: "Leave your “this is good”",
    heroTitleLine: "on the map.",
    heroBody:
      "Anyone can find a place. Anyone can leave a note. A shared atlas for small discoveries — on a trip, or around the corner.",
    openAtlas: "Open the atlas",
    leaveSpot: "Leave a new spot",
    honestCount: (n: number) => `${n} public · anyone can leave one`,
    mapTitle: "Places people have left",
    searchLabel: "Search places on the map",
    searchPlaceholder: "e.g. Senso-ji, Ueno Park, Shibuya",
    searchButton: "Search",
    listTitle: "Spot list",
    filterPlaceholder: "Search place, area, or category",
    all: "All",
    outOfMap: "Off this map",
    inMap: "In view",
    howTitle: "The same map grows through the people who find and leave things.",
    howFind: "Find",
    howFindBody: "Look for a place on the map or in the list.",
    howSave: "Leave",
    howSaveBody: "Click a place and leave a short note.",
    howConnect: "Connect",
    howConnectBody: "A small discovery becomes someone else’s next step.",
    footer: "Spot is a quiet, open place for nearby discoveries.",
    year: "2026 / open to all",
    formTitle: "Leave a new spot",
    formBody: "Click the map to set the location.",
    name: "Name",
    area: "Area",
    category: "Category",
    note: "Note",
    saveAction: "Leave this place",
    cancel: "Close",
    registered: "Spot saved.",
    empty: "No spots match.",
    mine: "My spots",
  },
} as const;

function inTokyoView(lat: number, lng: number) {
  return lat > 35.5 && lat < 35.9 && lng > 139.4 && lng < 140;
}

type Draft = {
  name: string;
  area: string;
  category: string;
  note: string;
  lat: string;
  lng: string;
};

export default function Home() {
  const { isAuthenticated, logout } = useAuth();
  const [lang, setLang] = useState<"ja" | "en">("ja");
  const t = copy[lang];
  const listQuery = trpc.spots.list.useQuery();
  const createMutation = trpc.spots.create.useMutation({
    onSuccess: async () => {
      toast.success(t.registered);
      setFormOpen(false);
      await listQuery.refetch();
    },
    onError: () => toast.error("Could not save."),
  });
  const spots = listQuery.data ?? [];
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({
    name: "",
    area: "",
    category: "公園",
    note: "",
    lat: String(TOKYO_CENTER.lat),
    lng: String(TOKYO_CENTER.lng),
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  const categories = useMemo(() => {
    const set = new Set(spots.map((spot) => spot.category));
    return Array.from(set);
  }, [spots]);

  const filtered = useMemo(
    () =>
      spots
        .filter((spot) => (category !== "all" && spot.category !== category ? false : true))
        .filter((spot) =>
          query.trim()
            ? `${spot.name}${spot.area}${spot.category}${spot.note}`.includes(query.trim())
            : true
        )
        .slice()
        .sort((a, b) => {
          const aIn = inTokyoView(Number(a.lat), Number(a.lng)) ? 0 : 1;
          const bIn = inTokyoView(Number(b.lat), Number(b.lng)) ? 0 : 1;
          return aIn - bIn;
        }),
    [spots, category, query]
  );

  const nearbyCards = useMemo(
    () => spots.filter((spot) => inTokyoView(Number(spot.lat), Number(spot.lng))).slice(0, 3),
    [spots]
  );

  const drawMarkers = useCallback(
    (map: google.maps.Map) => {
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current = [];
      spots.forEach((spot) => {
        const pin = document.createElement("div");
        pin.style.width = "14px";
        pin.style.height = "14px";
        pin.style.background = "#de6848";
        pin.style.border = "2px solid #fffaf3";
        pin.style.borderRadius = "50% 50% 50% 0";
        pin.style.transform = "rotate(-45deg)";
        pin.title = spot.name;
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: Number(spot.lat), lng: Number(spot.lng) },
          content: pin,
          title: spot.name,
        });
        marker.addListener("click", () => {
          setSelectedId(spot.id);
          map.panTo({ lat: Number(spot.lat), lng: Number(spot.lng) });
        });
        markersRef.current.push(marker);
      });
    },
    [spots]
  );

  useEffect(() => {
    if (mapRef.current) drawMarkers(mapRef.current);
  }, [drawMarkers]);

  const onMapReady = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      map.setOptions({
        styles: [
          { stylers: [{ saturation: -35 }, { lightness: 8 }] },
          { featureType: "poi", stylers: [{ visibility: "simplified" }] },
          { featureType: "water", stylers: [{ color: "#adc0be" }] },
        ],
      });
      map.addListener("click", (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;
        setDraft((current) => ({
          ...current,
          lat: event.latLng!.lat().toFixed(5),
          lng: event.latLng!.lng().toFixed(5),
        }));
        setFormOpen(true);
      });
      drawMarkers(map);
    },
    [drawMarkers]
  );

  const searchPlace = async (event: React.FormEvent) => {
    event.preventDefault();
    const address = query.trim();
    if (!address || !window.google || !mapRef.current) return;
    new google.maps.Geocoder().geocode({ address, region: "jp" }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        mapRef.current?.panTo(results[0].geometry.location);
        mapRef.current?.setZoom(14);
      } else {
        toast.error(lang === "ja" ? "見つかりませんでした。" : "No place found.");
      }
    });
  };

  const leaveSpot = async (event: React.FormEvent) => {
    event.preventDefault();
    await createMutation.mutateAsync(draft);
    setDraft({
      name: "",
      area: "",
      category: "公園",
      note: "",
      lat: String(TOKYO_CENTER.lat),
      lng: String(TOKYO_CENTER.lng),
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <a href="#top" className="text-2xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
            {t.brand}
          </a>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground sm:flex">
            <a href="#atlas" className="hover:text-foreground">
              {t.explore}
            </a>
            <button type="button" className="hover:text-foreground" onClick={() => setFormOpen(true)}>
              {t.save}
            </button>
            <a href="#connect" className="hover:text-foreground">
              {t.connect}
            </a>
            {isAuthenticated ? (
              <Link href="/my" className="hover:text-foreground">
                {t.mine}
              </Link>
            ) : null}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              className="text-muted-foreground"
              onClick={() => setLang(lang === "ja" ? "en" : "ja")}
            >
              <b className="text-foreground">{lang === "ja" ? "JA" : "EN"}</b>
              {" | "}
              {lang === "ja" ? "EN" : "JA"}
            </button>
            {isAuthenticated ? (
              <>
                <Link href="/my" className="text-sm hover:text-foreground sm:hidden">
                  {t.mine}
                </Link>
                <Button variant="ghost" size="sm" onClick={() => void logout()}>
                  {t.logout}
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => startLogin()}>
                {t.login}
              </Button>
            )}
            <Button
              size="sm"
              className="rounded-full bg-[#de6848] text-white hover:bg-[#c45336]"
              onClick={() => (isAuthenticated ? setFormOpen(true) : startLogin())}
            >
              {t.join}
            </Button>
          </div>
        </div>
      </header>

      <section id="top" className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#c45336]">{t.eyebrow}</p>
          <h1 className="mt-3 text-[clamp(2rem,3.6vw,3.25rem)] leading-[1.22]">
            <span className="block sm:whitespace-nowrap">{t.heroTitle}</span>
            {t.heroTitleLine}
          </h1>
          <p className="mt-4 max-w-xl text-[17px] leading-7 text-muted-foreground">{t.heroBody}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="rounded-none px-5">
              <a href="#atlas">{t.openAtlas}</a>
            </Button>
            <Button variant="outline" className="rounded-none bg-transparent" onClick={() => setFormOpen(true)}>
              {t.leaveSpot}
            </Button>
          </div>
          <p className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
            {t.honestCount(spots.length)}
          </p>
        </div>
        <aside className="relative min-h-[420px] overflow-hidden border border-border bg-[#e7dcc8]">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <svg viewBox="0 0 800 520" className="h-full w-full">
              <rect width="800" height="520" fill="#e7dcc8" />
              <path
                d="M80 80 C200 40 280 140 360 120 C470 90 520 210 640 180 C720 160 760 240 740 320 C700 430 520 460 360 430 C220 400 80 360 70 240 Z"
                fill="#ddd1bb"
                stroke="#c9b89a"
              />
              <path
                d="M120 300 C220 280 300 330 390 300 C500 260 620 300 700 280"
                fill="none"
                stroke="#b7c4c2"
                strokeWidth="18"
              />
              <text
                x="430"
                y="250"
                fontSize="42"
                fill="#1c2430"
                opacity="0.18"
                fontFamily="Shippori Mincho, serif"
              >
                東京
              </text>
            </svg>
          </div>
          <div className="absolute right-6 top-8 w-[min(320px,86%)] border border-border bg-[#fbf7ee] p-4 shadow-[0_24px_50px_rgba(28,36,48,0.12)]">
            {nearbyCards.map((spot) => (
              <button
                key={spot.id}
                type="button"
                className="block w-full border-b border-border py-3 text-left last:border-0"
                onClick={() => {
                  setSelectedId(spot.id);
                  mapRef.current?.panTo({ lat: Number(spot.lat), lng: Number(spot.lng) });
                }}
              >
                <div className="font-[family-name:var(--font-display)] text-[15px]">{spot.name}</div>
                <div className="text-[11px] text-muted-foreground">{spot.area}</div>
                <p className="mt-1 text-xs leading-5">{spot.note}</p>
              </button>
            ))}
          </div>
        </aside>
      </section>

      <section id="atlas" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-4">
          <h2 className="text-3xl">{t.mapTitle}</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="relative overflow-hidden border border-border">
            <form
              onSubmit={searchPlace}
              className="absolute left-3 top-3 z-10 flex gap-2 border border-border bg-[#fbf7ee] p-2"
            >
              <Label htmlFor="placeSearch" className="sr-only">
                {t.searchLabel}
              </Label>
              <Input
                id="placeSearch"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.searchPlaceholder}
                className="h-9 w-[min(280px,55vw)] border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <Button
                type="submit"
                className="h-9 rounded-none bg-[#de6848] text-white hover:bg-[#c45336]"
              >
                {t.searchButton}
              </Button>
            </form>
            <MapView
              className="h-[640px] w-full"
              initialCenter={TOKYO_CENTER}
              initialZoom={11}
              onMapReady={onMapReady}
            />
            <p className="absolute bottom-3 left-3 z-10 border border-border bg-[#fbf7ee] px-3 py-1.5 text-xs text-muted-foreground">
              {t.honestCount(spots.length)} ·{" "}
              {spots.filter((spot) => inTokyoView(Number(spot.lat), Number(spot.lng))).length} {t.inMap}
            </p>
          </div>
          <aside className="border border-border bg-card p-5">
            <h3 className="text-2xl">{t.listTitle}</h3>
            <Input
              className="mt-3 rounded-none bg-white"
              placeholder={t.filterPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory("all")}
                className={`border px-2.5 py-1 text-xs ${
                  category === "all" ? "border-foreground bg-foreground text-background" : "border-border"
                }`}
              >
                {t.all}
              </button>
              {categories.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategory(name)}
                  className={`border px-2.5 py-1 text-xs ${
                    category === name ? "border-foreground bg-foreground text-background" : "border-border"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="mt-2 divide-y divide-border">
              {filtered.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">{t.empty}</p>
              ) : (
                filtered.map((spot) => {
                  const offMap = !inTokyoView(Number(spot.lat), Number(spot.lng));
                  const active = selectedId === spot.id;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      className={`block w-full py-4 text-left ${active ? "bg-secondary/60" : ""}`}
                      onClick={() => {
                        setSelectedId(spot.id);
                        mapRef.current?.panTo({ lat: Number(spot.lat), lng: Number(spot.lng) });
                        if (!offMap) mapRef.current?.setZoom(14);
                      }}
                    >
                      <div className="font-[family-name:var(--font-display)] text-base">{spot.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {spot.area}
                        {offMap ? ` · ${t.outOfMap}` : ""}
                      </div>
                      <div className="mt-1 text-[11px] tracking-wide text-[#c45336]">{spot.category}</div>
                      <p className="mt-1 text-sm leading-6">{spot.note}</p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </section>

      <section
        id="connect"
        className="mx-auto grid max-w-6xl gap-10 border-t border-border px-4 py-16 sm:grid-cols-3"
      >
        <p className="sm:col-span-3 text-3xl">{t.howTitle}</p>
        {(
          [
            ["01", t.howFind, t.howFindBody],
            ["02", t.howSave, t.howSaveBody],
            ["03", t.howConnect, t.howConnectBody],
          ] as const
        ).map(([num, title, body]) => (
          <div key={num}>
            <div className="text-xs tracking-[0.14em] text-[#c45336]">{num}</div>
            <h3 className="mt-2 text-3xl">{title}</h3>
            <p className="mt-2 text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 border-t border-foreground px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <p>{t.footer}</p>
        <p>{t.year}</p>
      </footer>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="rounded-none border-border bg-card" id="save">
          <DialogHeader>
            <DialogTitle>{t.formTitle}</DialogTitle>
            <DialogDescription>{t.formBody}</DialogDescription>
          </DialogHeader>
          <form className="grid gap-3" onSubmit={leaveSpot}>
            <div>
              <Label htmlFor="name">{t.name}</Label>
              <Input
                id="name"
                required
                className="rounded-none"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="area">{t.area}</Label>
              <Input
                id="area"
                required
                className="rounded-none"
                value={draft.area}
                onChange={(event) => setDraft({ ...draft, area: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="cat">{t.category}</Label>
              <Input
                id="cat"
                required
                className="rounded-none"
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="note">{t.note}</Label>
              <Textarea
                id="note"
                required
                className="rounded-none"
                value={draft.note}
                onChange={(event) => setDraft({ ...draft, note: event.target.value })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {draft.lat}, {draft.lng}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-none bg-transparent"
                onClick={() => setFormOpen(false)}
              >
                {t.cancel}
              </Button>
              <Button
                type="submit"
                className="rounded-none bg-[#de6848] text-white hover:bg-[#c45336]"
                disabled={createMutation.isPending}
              >
                {t.saveAction}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
