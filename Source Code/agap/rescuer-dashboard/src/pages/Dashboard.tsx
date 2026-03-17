import { useState, useEffect } from "react";
import { supabase } from "../supabase/client";
import { DistressSignal } from "../types";
import Map from "../components/Map";
import Sidebar from "../components/Sidebar";
import { voiceSystem } from "../utils/VoiceAlertSystem";
import {
  Volume2,
  VolumeX,
  Radio,
  Menu,
  ShieldAlert,
  Activity,
  Phone,
  Sun,
  Moon,
  Square,
} from "lucide-react";
import SignalDetailsModal from "../components/SignalDetailsModal";
import { clsx } from "clsx";
import { useTheme } from "../hooks/useTheme";

export default function Dashboard() {
  const [signals, setSignals] = useState<DistressSignal[]>([]);
  const [totalSignalCount, setTotalSignalCount] = useState(0);
  const [activeSignalId, setActiveSignalId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(
    undefined,
  );
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();

  // Computed active signal based on ID to avoid stale state in closures
  const activeSignal = signals.find((s) => s.id === activeSignalId) || null;

  useEffect(() => {
    fetchSignals();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("distress_signals_channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "distress_signals" },
        (payload) => {
          console.log("Realtime update:", payload);
          if (payload.eventType === "INSERT") {
            const newSignal = payload.new as DistressSignal;
            setSignals((prev) => [newSignal, ...prev]);
            setTotalSignalCount((prev) => prev + 1);
            // Voice alert for new dire signals
            if (newSignal.severity === "dire") {
              voiceSystem.announceAlert(newSignal);
            }
          } else if (payload.eventType === "UPDATE") {
            setSignals((prev) =>
              prev.map((s) =>
                s.id === payload.new.id ? (payload.new as DistressSignal) : s,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array to prevent re-subscriptions

  useEffect(() => {
    voiceSystem.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const fetchSignals = async () => {
    const { data, error, count } = await supabase
      .from("distress_signals")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (error) console.error("Error fetching signals:", error);
    else {
      setSignals(data as DistressSignal[]);
      if (count !== null) setTotalSignalCount(count);
    }
  };

  const handleSignalClick = (signal: DistressSignal) => {
    setActiveSignalId(signal.id);
    setMapCenter([signal.latitude, signal.longitude]);
    setIsModalOpen(true);
  };

  const simulateSignal = async () => {
    const lat = 14.5995 + (Math.random() - 0.5) * 0.1;
    const lng = 120.9842 + (Math.random() - 0.5) * 0.1;
    const severity = Math.random() > 0.5 ? "dire" : "normal";

    await supabase.from("distress_signals").insert({
      user_id: crypto.randomUUID(),
      latitude: lat,
      longitude: lng,
      severity: severity,
      status: "pending",
      people_count: Math.floor(Math.random() * 5) + 1,
      voice_transcript: "Help! The water is rising fast!",
      created_at: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-aura-black text-gray-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <div className="h-16 bg-white dark:bg-aura-black border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 z-30 shadow-lg transition-colors duration-300">
        <div className="flex items-center gap-1">
          <div>
            <Square color="red" size={32} strokeWidth={4} absoluteStrokeWidth />
          </div>
          <h1 className="text-2xl font-bold leading-none">
            AGAP Command Center
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {/* Stats pill group */}
          <div className="flex items-center gap-0 bg-gray-50 dark:bg-aura-black border p-0.5 rounded-sm overflow-hidden">
            <div className="flex items-baseline gap-1.5 px-3 py-1">
              <span className="text-sm text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-medium">
                Calls:
              </span>
              <span className="text-[15px] font-medium text-slate-900 dark:text-zinc-100 leading-none">
                {totalSignalCount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 border-l">
              <span className="text-sm text-red-700 dark:text-red-400 uppercase tracking-wider font-medium">
                Critical:
              </span>
              <span className="text-[15px] font-medium text-red-600 dark:text-red-400 leading-none">
                {signals.filter((s) => s.severity === "dire").length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 border-l">
              <span className="text-sm text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-medium">
                Active:
              </span>
              <span className="text-[15px] font-medium text-slate-900 dark:text-zinc-100 leading-none">
                {signals.filter((s) => s.status === "in-progress").length}
              </span>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-black/8 dark:border-white/8 text-slate-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5" />
            ) : (
              <Moon className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Sidebar toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-black/8 dark:border-white/8 text-slate-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Menu className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative bg-gray-100 dark:bg-aura-black transition-colors duration-300">
          <Map
            signals={signals}
            onMarkerClick={handleSignalClick}
            center={mapCenter}
          />

          {/* Sim Button (Hidden in production ideally) */}
          <div className="absolute bottom-6 left-6 z-[1000]">
            <button
              onClick={simulateSignal}
              className="group flex items-center justify-center p-3 rounded-full shadow-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-600"
              title="Simulate Distress Signal"
            >
              <Radio className="h-5 w-5 group-hover:animate-pulse text-gray-400 group-hover:text-red-500 dark:group-hover:text-white" />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div
          className={clsx(
            "w-[450px] border-l border-gray-200 dark:border-gray-800 z-20 bg-white dark:bg-aura-dark transition-all duration-300 absolute right-0 top-0 bottom-0 md:relative",
            !isSidebarOpen && "translate-x-full md:translate-x-0 md:hidden",
          )}
        >
          <Sidebar
            signals={signals}
            onSignalClick={handleSignalClick}
            activeSignalId={activeSignal?.id}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </div>

      <SignalDetailsModal
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        signal={activeSignal}
      />
    </div>
  );
}
