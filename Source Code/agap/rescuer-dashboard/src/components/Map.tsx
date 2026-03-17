import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { DivIcon } from "leaflet";
import { DistressSignal } from "../types";
import { useEffect } from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Clock,
  Mic,
  ShieldAlert,
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

// Colors perfectly mapped to Tailwind's default red-500, amber-500, and emerald-500
const icons = {
  red: createPulseIcon("#EF4444"),
  amber: createPulseIcon("#F59E0B"),
  emerald: createPulseIcon("#10B981"),
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
    if (signal.status === "resolved") return icons.emerald;
    if (signal.severity === "dire") return icons.red;
    return icons.amber;
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={6}
        maxBounds={maxBounds}
        style={{ height: "100%", width: "100%" }}
        // Targeting Leaflet's internal classes to make the popup container transparent and clean
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
                className="w-[280px] overflow-hidden rounded-xl bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-2xl border border-slate-200/60 dark:border-zinc-800/60 shadow-xl transition-colors duration-300"
                style={{ fontFamily: "inherit" }}
              >
                <div className="p-4">
                  {/* Card Header matching sidebar style */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={clsx(
                        "p-2.5 rounded-lg flex-shrink-0",
                        signal.status === "resolved"
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : signal.severity === "dire"
                            ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                            : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {signal.status === "resolved" ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : signal.severity === "dire" ? (
                        <ShieldAlert className="h-4 w-4" />
                      ) : (
                        <AlertTriangle className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <h3
                          className={clsx(
                            "font-semibold text-sm leading-tight truncate",
                            signal.status === "resolved"
                              ? "text-emerald-700 dark:text-emerald-400"
                              : signal.severity === "dire"
                                ? "text-red-700 dark:text-red-400"
                                : "text-amber-700 dark:text-amber-400",
                          )}
                        >
                          Signal #{signal.id.slice(0, 6)}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                          <Clock className="h-3 w-3" />
                          {signal.created_at
                            ? format(new Date(signal.created_at), "HH:mm")
                            : "Now"}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-0.5 font-medium tracking-wide">
                        {signal.people_count || 1} PERSON(S)
                      </p>
                    </div>
                  </div>

                  {/* Transcript Box matching sidebar */}
                  <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-lg p-3 border border-slate-100 dark:border-zinc-800/50 mb-4">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Mic className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                        Live Transcript
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-zinc-300 italic line-clamp-2 pl-2 border-l-[1.5px] border-slate-300 dark:border-zinc-700">
                      "
                      {signal.voice_transcript ||
                        "Audio transcript processing..."}
                      "
                    </p>
                  </div>

                  {/* CTA matching sidebar's group hover links/cards */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkerClick(signal);
                    }}
                    className="group w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-white dark:bg-[#09090b] border border-slate-200/60 dark:border-zinc-700/60 hover:bg-slate-50 dark:hover:bg-zinc-900 active:scale-[0.98] transition-all"
                  >
                    <span>Manage Signal</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
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
