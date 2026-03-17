import { Fragment, useState } from "react";
import { Dialog, Transition, Listbox } from "@headlessui/react";
import {
  X,
  Check,
  ChevronDown,
  MapPin,
  Mic,
  Clock,
  AlertTriangle,
  Users,
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
    console.log("Updating status to:", newStatus, "for ID:", signal.id);

    const { data, error } = await supabase
      .from("distress_signals")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", signal.id)
      .select();

    if (error) {
      console.error("Error updating status:", error);
      alert(`Failed to update status: ${error.message}`);
      setLoading(false);
    } else if (!data || data.length === 0) {
      console.error(
        "Update failed: No data returned. This may indicate an RLS policy issue.",
      );
      alert(
        "Failed to update status: Permission denied. Check your RLS policies.",
      );
      setLoading(false);
    } else {
      console.log("Update successful:", data);
      setSuccessMessage(`Status updated to ${newStatus.replace("-", " ")}`);

      setTimeout(() => {
        setLoading(false);
        closeModal();
      }, 800);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[2000]" onClose={closeModal}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4 sm:translate-y-0"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4 sm:translate-y-0"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white dark:bg-aura-card border border-gray-100 dark:border-gray-800 p-6 sm:p-8 text-left align-middle shadow-2xl transition-all">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Dialog.Title
                      as="h3"
                      className="text-2xl font-extrabold leading-6 text-gray-900 dark:text-white flex items-center gap-2"
                    >
                      {signal.severity === "dire" && (
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                      )}
                      Signal Details
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      ID:{" "}
                      <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-aura-primary dark:text-blue-400">
                        {signal.id.slice(0, 8)}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="rounded-full p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-aura-primary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status Selector */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Update Status
                    </label>
                    <Listbox
                      value={signal.status}
                      onChange={handleStatusChange}
                      disabled={loading}
                    >
                      <div className="relative mt-1">
                        <Listbox.Button
                          className={clsx(
                            "relative w-full cursor-pointer rounded-xl bg-gray-50 dark:bg-gray-900/50 py-3 pl-4 pr-10 text-left border border-gray-200 dark:border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-aura-primary transition-colors sm:text-sm",
                            loading && "opacity-60 cursor-not-allowed",
                            !loading &&
                              "hover:border-gray-300 dark:hover:border-gray-600",
                          )}
                        >
                          <span
                            className={clsx(
                              "block truncate uppercase font-bold tracking-wide",
                              signal.status === "resolved"
                                ? "text-green-600 dark:text-green-500"
                                : signal.status === "in-progress"
                                  ? "text-blue-600 dark:text-blue-500"
                                  : "text-gray-600 dark:text-gray-400",
                            )}
                          >
                            {signal.status.replace("-", " ")}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronDown
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </span>
                        </Listbox.Button>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white dark:bg-aura-card border border-gray-100 dark:border-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                            {statusOptions.map((option, idx) => (
                              <Listbox.Option
                                key={idx}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-3 pl-10 pr-4 transition-colors ${
                                    active
                                      ? "bg-blue-50 dark:bg-gray-800 text-blue-900 dark:text-white"
                                      : "text-gray-700 dark:text-gray-300"
                                  } ${loading ? "opacity-50 cursor-not-allowed" : ""}`
                                }
                                value={option.value}
                                disabled={loading}
                              >
                                {({ selected }) => (
                                  <>
                                    <span
                                      className={`block truncate ${selected ? "font-bold text-blue-600 dark:text-blue-400" : "font-medium"}`}
                                    >
                                      {option.name}
                                    </span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                                        <Check
                                          className="h-5 w-5"
                                          aria-hidden="true"
                                        />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>

                    {/* Feedback Messages */}
                    <Transition
                      show={!!successMessage}
                      enter="transition-opacity duration-300"
                      enterFrom="opacity-0"
                      enterTo="opacity-100"
                      leave="transition-opacity duration-300"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-400">
                          {successMessage}
                        </span>
                      </div>
                    </Transition>

                    {loading && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg flex items-center gap-3">
                        <div className="h-4 w-4 border-2 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-400">
                          Updating status...
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={clsx(
                        "p-4 rounded-xl border transition-colors",
                        signal.severity === "dire"
                          ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30"
                          : "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30",
                      )}
                    >
                      <p
                        className={clsx(
                          "text-xs font-bold uppercase tracking-wider mb-1",
                          signal.severity === "dire"
                            ? "text-red-600 dark:text-red-500"
                            : "text-amber-600 dark:text-amber-500",
                        )}
                      >
                        Severity Level
                      </p>
                      <p
                        className={clsx(
                          "text-xl font-black tracking-tight",
                          signal.severity === "dire"
                            ? "text-red-700 dark:text-red-400"
                            : "text-amber-700 dark:text-amber-400",
                        )}
                      >
                        {signal.severity === "dire" ? "CRITICAL" : "NORMAL"}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors">
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        People Count
                      </p>
                      <p className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                        {signal.people_count || 1} Person(s)
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Coordinates
                      </p>
                    </div>
                    <div className="bg-white dark:bg-black/40 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700/50 inline-block shadow-sm">
                      <p className="font-mono text-sm font-medium text-gray-800 dark:text-gray-300 tracking-tight">
                        {signal.latitude.toFixed(6)},{" "}
                        {signal.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>

                  {/* Transcript */}
                  <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-blue-100 dark:bg-blue-900/50 p-1.5 rounded-lg">
                        <Mic className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                        Voice Transcript
                      </p>
                    </div>
                    <div className="border-l-2 border-blue-200 dark:border-blue-800 pl-3 py-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
                        "{signal.voice_transcript || "No transcript available"}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-xl border border-transparent bg-aura-primary px-6 py-3.5 text-sm font-bold text-white hover:bg-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 w-full transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                    onClick={closeModal}
                  >
                    Close Details
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
