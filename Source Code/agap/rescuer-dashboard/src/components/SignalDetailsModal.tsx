import { Fragment, useState } from "react";
import { Dialog, Transition, Listbox } from "@headlessui/react";
import {
  X,
  Check,
  ChevronDown,
  MapPin,
  Mic,
  Users,
  AlertTriangle,
  Activity,
  CheckCircle,
  ExternalLink,
  Clock,
} from "lucide-react";
import { DistressSignal } from "../types";
import { supabase } from "../supabase/client";
import { format } from "date-fns";
import { clsx } from "clsx";

interface SignalDetailsModalProps {
  isOpen: boolean;
  closeModal: () => void;
  signal: DistressSignal | null;
}

const statusOptions = [
  { name: "Pending", value: "pending" },
  { name: "In Progress", value: "in-progress" },
  { name: "Resolved", value: "resolved" },
];

export default function SignalDetailsModal({
  isOpen,
  closeModal,
  signal,
}: SignalDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (!signal) return null;

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === signal.status) return;

    setLoading(true);
    setSuccessMessage("");

    const { data, error } = await supabase
      .from("distress_signals")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", signal.id)
      .select();

    if (error) {
      console.error("Update error:", error.message);
      setLoading(false);
    } else if (data && data.length > 0) {
      setSuccessMessage(`Status updated to ${newStatus}`);
      setTimeout(() => {
        setLoading(false);
        closeModal();
      }, 800);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[2000]" onClose={closeModal}>
        {/* Backdrop - Matches Sidebar Blur */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-2xl border border-slate-200/60 dark:border-zinc-800/60 p-6 text-left align-middle shadow-2xl transition-all">
                {/* Header - Matches Sidebar Header Style */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                      <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-bold text-slate-900 dark:text-white tracking-tight"
                      >
                        Signal Analysis
                      </Dialog.Title>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(signal.created_at), "MMM d, HH:mm")}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800/50 text-slate-400 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Status Selection */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-500 mb-2">
                      Routing Status
                    </label>
                    <Listbox
                      value={signal.status}
                      onChange={handleStatusChange}
                      disabled={loading}
                    >
                      <div className="relative">
                        <Listbox.Button className="relative w-full cursor-pointer rounded-xl border border-slate-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/50 py-3 pl-4 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all sm:text-sm">
                          <span
                            className={clsx(
                              "block truncate font-semibold",
                              signal.status === "resolved"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-blue-600 dark:text-blue-400",
                            )}
                          >
                            {signal.status === "resolved"
                              ? "System Resolved"
                              : "Active Deployment"}
                          </span>
                          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          </span>
                        </Listbox.Button>
                        <Listbox.Options className="absolute mt-2 max-h-60 w-full overflow-auto rounded-xl border border-slate-200/60 dark:border-zinc-800/60 bg-white dark:bg-[#09090b] py-1 shadow-xl ring-1 ring-black/5 focus:outline-none z-50">
                          {statusOptions.map((option) => (
                            <Listbox.Option
                              key={option.value}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-2.5 pl-10 pr-4 transition-colors ${
                                  active
                                    ? "bg-slate-50 dark:bg-zinc-900 text-blue-600 dark:text-blue-400"
                                    : "text-slate-700 dark:text-zinc-300"
                                }`
                              }
                              value={option.value}
                            >
                              {({ selected }) => (
                                <>
                                  <span
                                    className={clsx(
                                      "block truncate text-sm",
                                      selected ? "font-bold" : "font-medium",
                                    )}
                                  >
                                    {option.name}
                                  </span>
                                  {selected && (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-500">
                                      <Check className="h-4 w-4" />
                                    </span>
                                  )}
                                </>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                    {successMessage && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in slide-in-from-top-1">
                        <CheckCircle className="h-3 w-3" /> {successMessage}
                      </div>
                    )}
                  </div>

                  {/* Info Cards - Matching Sidebar Tags Style */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className={clsx(
                        "p-4 rounded-xl border",
                        signal.severity === "dire"
                          ? "bg-red-50/50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20"
                          : "bg-amber-50/50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/20",
                      )}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Severity
                      </p>
                      <p
                        className={clsx(
                          "text-base font-bold flex items-center gap-2",
                          signal.severity === "dire"
                            ? "text-red-600 dark:text-red-400"
                            : "text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {signal.severity === "dire"
                          ? "Critical Care"
                          : "Standard"}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                        Personnel
                      </p>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                          {signal.people_count || 1} Total
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Transcript - Styled like Sidebar Feed Items */}
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800/60 bg-white dark:bg-[#09090b]">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" /> Geo-Position
                        </p>
                        <a
                          href={`https://www.google.com/maps?q=${signal.latitude},${signal.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          View Map <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <p className="font-mono text-xs font-medium text-slate-600 dark:text-zinc-400">
                        {signal.latitude.toFixed(6)},{" "}
                        {signal.longitude.toFixed(6)}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200/60 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-zinc-900/50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Mic className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Live Transcription
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-zinc-300 italic leading-relaxed pl-3 border-l-2 border-blue-200 dark:border-blue-900/50">
                        "
                        {signal.voice_transcript ||
                          "Listening for incoming audio data..."}
                        "
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    className="flex-1 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white text-sm font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                    onClick={closeModal}
                  >
                    Confirm & Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
