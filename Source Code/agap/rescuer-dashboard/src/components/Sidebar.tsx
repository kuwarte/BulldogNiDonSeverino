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
    <div className="h-full bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-2xl flex flex-col w-full z-20 relative transition-colors duration-300">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200/60 dark:border-zinc-800/60 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-1.5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <div className="flex items-center justify-center w-7 h-7 bg-blue-50 dark:bg-blue-500/10 rounded-md">
              <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            Live Triage Feed
          </h2>

          <div className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-full flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wide uppercase">
              Agent Active
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-500 dark:text-zinc-400 ml-9.5">
          Real-time distress analysis & routing
        </p>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-zinc-800">
        {signals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in duration-500">
            <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-full border border-slate-100 dark:border-zinc-800/50">
              <Activity className="h-8 w-8 text-slate-400 dark:text-zinc-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-zinc-200 text-sm">
                System Idle
              </p>
              <p className="text-sm text-slate-500 dark:text-zinc-500 mt-0.5">
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
                "group relative p-4 cursor-pointer rounded-xl border transition-all duration-200 ease-in-out",
                activeSignalId === signal.id
                  ? "bg-blue-50/40 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50 shadow-sm"
                  : "bg-white dark:bg-[#09090b] border-slate-200/60 dark:border-zinc-800/60 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 shadow-sm hover:shadow",
              )}
            >
              {/* Card Header */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={clsx(
                    "p-2.5 rounded-lg flex-shrink-0",
                    signal.severity === "dire"
                      ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                      : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
                  )}
                >
                  {signal.severity === "dire" ? (
                    <ShieldAlert className="h-5 w-5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex justify-between items-start gap-2">
                    <h3
                      className={clsx(
                        "font-semibold text-sm leading-tight truncate",
                        signal.severity === "dire"
                          ? "text-red-700 dark:text-red-400"
                          : "text-amber-700 dark:text-amber-400",
                      )}
                    >
                      {signal.severity === "dire"
                        ? "Immediate Rescue"
                        : "Stranded but Safe"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 font-medium">
                      <Clock className="h-3 w-3" />
                      {format(new Date(signal.created_at), "HH:mm")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-slate-600 dark:text-zinc-300 text-sm mb-3 leading-relaxed">
                {signal.severity === "dire"
                  ? "Critical situation detected. High water levels reported with potential medical emergency."
                  : "Individual reports being stranded. Currently stable but requires eventual evacuation."}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {signal.severity === "dire" ? (
                  <>
                    <span className="px-2 py-1 bg-red-50 dark:bg-red-500/10 rounded-md text-[11px] font-medium text-red-700 dark:text-red-400 tracking-wide">
                      High Distress
                    </span>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-zinc-800/80 rounded-md text-[11px] font-medium text-slate-600 dark:text-zinc-300 tracking-wide">
                      {signal.people_count || 1} Persons
                    </span>
                  </>
                ) : (
                  <>
                    <span className="px-2 py-1 bg-amber-50 dark:bg-amber-500/10 rounded-md text-[11px] font-medium text-amber-700 dark:text-amber-400 tracking-wide">
                      Calm Voice
                    </span>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-zinc-800/80 rounded-md text-[11px] font-medium text-slate-600 dark:text-zinc-300 tracking-wide">
                      Roof Location
                    </span>
                  </>
                )}
              </div>

              {/* Transcript Box */}
              <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-lg p-3 border border-slate-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Mic className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                    Live Transcript
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-zinc-300 italic mb-2 line-clamp-2 pl-2 border-l-[1.5px] border-slate-300 dark:border-zinc-700">
                  "{signal.voice_transcript || "Audio transcript processing..."}
                  "
                </p>
                <div className="flex justify-end mt-1">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 group/link cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    Full Audio
                    <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>

              {/* Status Footer */}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/50 flex justify-between items-center">
                <span
                  className={clsx(
                    "text-[11px] font-semibold uppercase tracking-wide flex items-center gap-1.5",
                    signal.status === "resolved"
                      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md"
                      : "text-slate-500 dark:text-zinc-400",
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
