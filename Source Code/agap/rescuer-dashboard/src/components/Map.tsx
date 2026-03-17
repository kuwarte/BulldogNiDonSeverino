import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { DivIcon } from "leaflet";
import { DistressSignal } from "../types";
import { useEffect } from "react";
import {
  AlertTriangle,
  Info,
  CheckCircle,
  ChevronRight,
  Users,
  Clock,
} from "lucide-react";
import { clsx } from "clsx";

const createPulseIcon = (color: string) => {
  return new DivIcon({
    className: "custom-div-icon",
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 4px ${color}40, 0 0 0 8px ${color}20;" class="animate-pulse"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
};

const icons = {
  red: createPulseIcon("#EF4444"),
  orange: createPulseIcon("#F59E0B"),
  green: createPulseIcon("#10B981"),
};

interface MapProps {
  signals: DistressSignal[];
  onMarkerClick: (signal: DistressSignal) => void;
  center?: [number, number];
}

function MapUpdater({ center }: { center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 2, easeLinearity: 0.25 });
    }
  }, [center, map]);
  return null;
}

export default function Map({ signals, onMarkerClick, center }: MapProps) {
  const defaultCenter: [number, number] = [12.8797, 121.774];
  const maxBounds: [[number, number], [number, number]] = [
    [4.5, 116.0],
    [21.5, 127.0],
  ];

  const getIcon = (signal: DistressSignal) => {
    if (signal.status === "resolved") return icons.green;
    if (signal.severity === "dire") return icons.red;
    return icons.orange;
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={6}
        maxBounds={maxBounds}
        style={{ height: "100%", width: "100%" }}
        // Targeting Leaflet's internal classes to make the popup container clean
        className="z-0 bg-slate-50 dark:bg-zinc-950 transition-colors duration-500 
                   [&_.leaflet-popup-content-wrapper]:bg-transparent [&_.leaflet-popup-content-wrapper]:shadow-none 
                   [&_.leaflet-popup-tip-container]:hidden [&_.leaflet-popup-content]:m-0"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          className="block dark:hidden"
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          className="hidden dark:block"
        />

        {center && <MapUpdater center={center} />}

        {signals.map((signal) => (
          <Marker
            key={signal.id}
            position={[signal.latitude, signal.longitude]}
            icon={getIcon(signal)}
          >
            <Popup closeButton={false} offset={[0, -10]}>
              <div
                className="w-[240px] overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 shadow-sm"
                style={{ fontFamily: "inherit" }}
              >
                {/* Color accent bar */}
                <div
                  className={clsx(
                    "h-[3px] w-full",
                    signal.status === "resolved"
                      ? "bg-green-500"
                      : signal.severity === "dire"
                        ? "bg-red-500"
                        : "bg-amber-400",
                  )}
                />

                <div className="p-3.5">
                  {/* Top row: badge + timestamp */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={clsx(
                          "w-[7px] h-[7px] rounded-full shrink-0",
                          signal.status === "resolved"
                            ? "bg-green-500"
                            : signal.severity === "dire"
                              ? "bg-red-500 animate-pulse"
                              : "bg-amber-400 animate-pulse",
                        )}
                      />
                      <span
                        className={clsx(
                          "text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded",
                          signal.status === "resolved"
                            ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                            : signal.severity === "dire"
                              ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
                        )}
                      >
                        {signal.status === "resolved"
                          ? "Resolved"
                          : signal.severity === "dire"
                            ? "Dire"
                            : "Alert"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                      2m ago
                    </span>
                  </div>

                  {/* Signal ID */}
                  <p className="text-[13px] font-medium text-slate-900 dark:text-zinc-100 mb-2 leading-snug">
                    Signal #{signal.id.slice(0, 7)}
                  </p>

                  {/* Transcript */}
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 mb-3 leading-relaxed px-2.5 py-2 bg-slate-50 dark:bg-zinc-800 rounded border-l-2 border-slate-200 dark:border-zinc-700 line-clamp-2">
                    "
                    {signal.voice_transcript || "Analyzing background audio..."}
                    "
                  </p>

                  {/* Stats row */}
                  <div className="flex gap-3 mb-3.5">
                    <div className="text-center">
                      <p className="text-base font-medium text-slate-900 dark:text-zinc-100 leading-none">
                        {signal.people_count ?? 1}
                      </p>
                      <p className="text-[9px] uppercase tracking-wide text-slate-400 mt-0.5">
                        People
                      </p>
                    </div>
                    <div className="w-px bg-slate-100 dark:bg-zinc-800" />
                    <div className="text-center">
                      <p className="text-base font-medium text-slate-900 dark:text-zinc-100 leading-none capitalize">
                        {signal.status}
                      </p>
                      <p className="text-[9px] uppercase tracking-wide text-slate-400 mt-0.5">
                        Status
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => onMarkerClick(signal)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-[12px] font-medium text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all"
                  >
                    <span>Manage signal</span>
                    <svg
                      className="w-3.5 h-3.5 opacity-50"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M3 7h8M8 4l3 3-3 3"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
