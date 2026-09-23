import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const FORGE_API_KEY = import.meta.env.VITE_MAPS_PROXY_KEY ?? "";
const FORGE_API_URL = "https://forge.manus.ai";
const MAPS_PROXY = `${FORGE_API_URL}/v1/maps/proxy`;

function loadGoogleMaps(): Promise<null> {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY}/maps/api/js?key=${FORGE_API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      resolve(null);
      script.remove();
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
    };
    document.head.appendChild(script);
  });
}

type MapViewProps = {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
};

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadGoogleMaps();
      if (cancelled || !containerRef.current) {
        if (!containerRef.current) console.error("Map container not found");
        return;
      }
      mapRef.current = new window.google.maps.Map(containerRef.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControl: true,
        streetViewControl: false,
        clickableIcons: false,
        gestureHandling: "greedy",
        mapId: "DEMO_MAP_ID",
      });
      onMapReady?.(mapRef.current);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialCenter, initialZoom, onMapReady]);

  return <div ref={containerRef} className={cn("w-full h-[500px]", className)} />;
}

export default MapView;
