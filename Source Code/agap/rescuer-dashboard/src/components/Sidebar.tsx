import { DistressSignal } from "../types";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  ShieldAlert,
  Mic,
  ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";

interface SidebarProps {
  signals: DistressSignal[];
  onSignalClick: (signal: DistressSignal) => void;
  activeSignalId?: string;
  onClose?: () => void;
}

export default function Sidebar({
  signals,
  onSignalClick,
  activeSignalId,
}: SidebarProps) {
  return (
    <div className="h-full bg-white/80 dark:bg-aura-dark/80 backdrop-blur-xl border-l border-gray-200/50 dark:border-gray-800/50 flex flex-col w-full md:w-[450px] z-20 relative transition-all duration-300 shadow-2xl">
      {/* Header - Added glass effect and softer borders */}
      <div className="p-6 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-aura-dark/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            Live Triage Feed
          </h2>
          <div className="px-3 py-1.5 bg-green-50/80 dark:bg-green-500/10 border border-green-200/50 dark:border-green-500/20 rounded-full flex items-center gap-2 backdrop-blur-sm shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-[10px] font-bold text-green-700 dark:text-green-400 tracking-widest uppercase">
              Agent Active
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-9">
          Real-time distress analysis & routing
        </p>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar">
        {signals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 space-y-4 animate-in fade-in duration-500">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-full border border-gray-100 dark:border-gray-800 shadow-inner">
              <Activity className="h-10 w-10 text-gray-400 dark:text-gray-600 opacity-50" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-200 text-lg">
                System Idle
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Listening for incoming signals...
              </p>
            </div>
          </div>
        ) : (
          signals.map((signal) => (
            <div
              key={signal.id}
              onClick={() => onSignalClick(signal)}
              className={clsx(
                "group relative p-5 cursor-pointer rounded-2xl border transition-all duration-300 ease-out",
                "hover:shadow-xl hover:-translate-y-1",
                activeSignalId === signal.id
                  ? "bg-blue-50/50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-500/50 shadow-md shadow-blue-900/5 dark:shadow-blue-900/20"
                  : "bg-white dark:bg-aura-card/60 border-gray-200/60 dark:border-gray-800 hover:border-blue-200 dark:hover:border-gray-700 shadow-sm",
              )}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className={clsx(
                    "p-3 rounded-xl shadow-sm flex-shrink-0",
                    signal.severity === "dire"
                      ? "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/40 dark:to-red-900/10 border border-red-200 dark:border-red-800/50"
                      : "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-900/10 border border-amber-200 dark:border-amber-800/50",
                  )}
                >
                  {signal.severity === "dire" ? (
                    <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400 drop-shadow-sm" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 drop-shadow-sm" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3
                      className={clsx(
                        "font-bold text-base leading-tight truncate",
                        signal.severity === "dire"
                          ? "text-red-700 dark:text-red-400"
                          : "text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {signal.severity === "dire"
                        ? "Immediate Rescue"
                        : "Stranded but Safe"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-800/50 px-2 py-1 rounded-md flex-shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(signal.created_at), "HH:mm")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed pl-1">
                {signal.severity === "dire"
                  ? "Critical situation detected. High water levels reported with potential medical emergency."
                  : "Individual reports being stranded. Currently stable but requires eventual evacuation."}
              </p>

              {/* Tags - Changed to pill shape for modern look */}
              <div className="flex flex-wrap gap-2 mb-4 pl-1">
                {signal.severity === "dire" ? (
                  <>
                    <span className="px-2.5 py-1 bg-red-100/50 dark:bg-red-500/10 border border-red-200/50 dark:border-red-500/20 rounded-full text-[11px] font-bold text-red-700 dark:text-red-400 tracking-wide uppercase">
                      High Distress
                    </span>
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[11px] font-bold text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                      {signal.people_count || 1} Persons
                    </span>
                  </>
                ) : (
                  <>
                    <span className="px-2.5 py-1 bg-amber-100/50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 rounded-full text-[11px] font-bold text-amber-700 dark:text-amber-400 tracking-wide uppercase">
                      Calm Voice
                    </span>
                    <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[11px] font-bold text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                      Roof Location
                    </span>
                  </>
                )}
              </div>

              {/* Transcript Box - Improved visual hierarchy */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-black/40 dark:to-gray-900/40 rounded-xl p-3.5 border border-gray-200/60 dark:border-gray-800/60 group-hover:border-gray-300 dark:group-hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative">
                    <Mic className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                    Live Transcript
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2 line-clamp-2 border-l-2 border-blue-200 dark:border-blue-500/30 pl-3">
                  "{signal.voice_transcript || "Audio transcript processing..."}
                  "
                </p>
                <div className="flex justify-end mt-1">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 group/link cursor-pointer hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                    Full Audio & Log
                    <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>

              {/* Status Footer */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/60 flex justify-between items-center pl-1">
                <span
                  className={clsx(
                    "text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                    signal.status === "resolved"
                      ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-md"
                      : "text-gray-500 dark:text-gray-400",
                  )}
                >
                  {signal.status === "resolved" ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5" /> Resolved
                    </>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      In Progress
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
