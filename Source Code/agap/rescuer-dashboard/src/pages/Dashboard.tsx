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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 transition-colors duration-300 font-sans">
      {/* Header (Glassmorphic) */}
      <header className="h-16 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-zinc-800/60 flex items-center justify-between px-6 z-30 shadow-sm transition-colors duration-300 shrink-0">
        {/* Brand/Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 shadow-inner">
            <Square size={20} strokeWidth={3} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            AGAP Command Center
          </h1>
        </div>

        {/* Right side Actions & Stats */}
        <div className="flex items-center gap-4">
          {/* Stats Badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
                Calls
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {totalSignalCount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
              <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide">
                Critical
              </span>
              <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                {signals.filter((s) => s.severity === "dire").length}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50">
              <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
                Active
              </span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {signals.filter((s) => s.status === "in-progress").length}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-zinc-800 mx-2 hidden sm:block"></div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={clsx(
                "w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200",
                isSidebarOpen
                  ? "bg-slate-100 text-slate-900 dark:bg-zinc-800 dark:text-white"
                  : "text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white",
              )}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex relative overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative bg-slate-50 dark:bg-[#09090b] transition-colors duration-300">
          <Map
            signals={signals}
            onMarkerClick={handleSignalClick}
            center={mapCenter}
          />

          {/* Floating Sim Button */}
          <div className="absolute bottom-6 left-6 z-[1000]">
            <button
              onClick={simulateSignal}
              className="group flex items-center justify-center w-12 h-12 rounded-full shadow-lg hover:shadow-xl bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all duration-300 border border-slate-200/50 dark:border-zinc-800/50"
              title="Simulate Distress Signal"
            >
              <Radio className="h-5 w-5 group-hover:animate-pulse group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div
          className={clsx(
            "w-[400px] border-l border-slate-200/60 dark:border-zinc-800/60 z-20 bg-white dark:bg-[#09090b] shadow-[-4px_0_24px_-12px_rgba(0,0,0,0.1)] transition-transform duration-300 absolute right-0 top-0 bottom-0 md:relative",
            !isSidebarOpen && "translate-x-full md:translate-x-0 md:hidden",
          )}
        >
          <Sidebar
            signals={signals}
            onSignalClick={handleSignalClick}
            activeSignalId={activeSignalId || undefined}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
      </main>

      <SignalDetailsModal
        isOpen={isModalOpen}
        closeModal={() => setIsModalOpen(false)}
        signal={activeSignal}
      />
    </div>
  );
}
