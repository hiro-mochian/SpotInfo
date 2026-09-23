import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Spot } from "../lib/spots";

type Coordinates = { lat: number; lng: number };

type MapViewProps = {
  className?: string;
  spots: Spot[];
  selectedId: string | null;
  initialCenter?: Coordinates;
  initialZoom?: number;
  onMapReady?: (map: L.Map) => void;
  onMapClick?: (coordinates: Coordinates) => void;
  onSelectSpot?: (spot: Spot) => void;
};

const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

function pinIcon(selected: boolean) {
  return L.divIcon({
    className: "spot-pin-shell",
    html: `<span class="spot-pin${selected ? " is-selected" : ""}" aria-hidden="true"></span>`,
    iconSize: [22, 28],
    iconAnchor: [11, 27],
  });
}

export function MapView({ className, spots, selectedId, initialCenter = { lat: 35.6812, lng: 139.7671 }, initialZoom = 11, onMapReady, onMapClick, onSelectSpot }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const readyRef = useRef(onMapReady);
  const clickRef = useRef(onMapClick);
  const selectRef = useRef(onSelectSpot);

  useEffect(() => { readyRef.current = onMapReady; clickRef.current = onMapClick; selectRef.current = onSelectSpot; }, [onMapReady, onMapClick, onSelectSpot]);
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { center: [initialCenter.lat, initialCenter.lng], zoom: initialZoom, zoomControl: true, attributionControl: true });
    L.tileLayer(import.meta.env.VITE_TILE_URL?.trim() || DEFAULT_TILE_URL, { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>' }).addTo(map);
    const markers = L.layerGroup().addTo(map);
    map.on("click", (event: L.LeafletMouseEvent) => clickRef.current?.({ lat: event.latlng.lat, lng: event.latlng.lng }));
    mapRef.current = map; markersRef.current = markers; readyRef.current?.(map);
    return () => { markers.clearLayers(); map.off(); map.remove(); mapRef.current = null; markersRef.current = null; };
  }, [initialCenter.lat, initialCenter.lng, initialZoom]);
  useEffect(() => {
    const markers = markersRef.current;
    if (!markers) return;
    markers.clearLayers();
    spots.forEach((spot) => { const marker = L.marker([spot.lat, spot.lng], { icon: pinIcon(selectedId === spot.id), title: spot.name, keyboard: true }); marker.on("click", () => selectRef.current?.(spot)); marker.addTo(markers); });
    return () => { markers.clearLayers(); };
  }, [spots, selectedId]);
  return <div ref={containerRef} className={`map-view ${className ?? ""}`} aria-label="スポット地図" role="application" />;
}

export default MapView;
