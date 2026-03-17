"use client";

import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  Wifi,
  WifiOff,
  TriangleAlert,
  CircleCheckBig,
  X,
  Download,
  Minus,
  Plus,
  LocateFixed,
  LocateOff,
  UsersRound,
  Gauge,
  PenLine,
  PhoneCall,
  ShieldAlert,
  Square,
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useTriageAgent } from "@/hooks/useTriageAgent";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useAgoraVoiceClient } from "@/hooks/useAgoraVoiceClient";
import { generateRequestId, publishRequest } from "@/lib/rescueStore";
import { detectIntent } from "@/lib/intentDetect";
import { RescueRequest, RescueStatus } from "@/types/rescue";
import { SiriWave } from "@/components/SiriWave";
import { PixelSOSButton } from "@/components/PixelSOSButton";

type Screen = "idle" | "listening" | "confirmed" | "offline-queued";

// ── Design tokens ─────────────────────────────────────────────────────────────
const ICON = 3;
const ICON_SM = "w-4 h-4";
const ICON_MD = "w-5 h-5";
const ICON_LG = "w-6 h-6";

const NM = "nm";
const NMI = "nm-inset";
const NM_BTN = "nm-btn";

// Minimal palette: only --tx-brand (red) as accent, all else uses --tx-* tokens
const TX = {
  brand:
    "text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--tx-brand)]",
  title: "text-xl font-semibold tracking-tight text-[var(--tx-title)]",
  heading: "text-base font-semibold text-[var(--tx-heading)]",
  body: "text-sm font-semibold text-[var(--tx-body)]",
  muted: "text-sm font-semibold text-[var(--tx-muted)]",
  label: "text-xs font-semibold text-[var(--tx-body)]",
  dim: "text-xs font-semibold text-[var(--tx-dim)]",
  mono: "font-mono text-sm font-semibold text-[var(--tx-mono)]",
  monoSm: "font-mono text-xs font-semibold text-[var(--tx-mono-sm)]",
};

const PAGE = "bg-[var(--app-bg)] flex flex-col w-full px-5";

type StatusBarProps = {
  currentTime: string;
  gpsStatus: "ready" | "locating" | string;
  online: boolean;
  connectionType: string;
  effectiveType: string;
};

function StatusBar({
  currentTime,
  gpsStatus,
  online,
  connectionType,
  effectiveType,
}: StatusBarProps) {
  const networkLabel = () => {
    if (!online) return "Offline";
    if (connectionType === "wifi") return "Wi-Fi";
    if (effectiveType === "4g") return "4G";
    if (effectiveType === "3g") return "3G";
    if (["2g", "slow-2g"].includes(effectiveType)) return "Weak";
    return "Online";
  };

  return (
    <div className="flex items-center justify-between px-5 py-3 -mx-5">
      <div className="flex items-center gap-2">
        <span className="flex gap-1 items-center text-xl font-bold tracking-widest text-red-600">
          <Square color="red" size={32} strokeWidth={3} absoluteStrokeWidth />
          AGAP
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`${NM} flex items-center gap-1.5 px-3 py-2`}>
          {online ? (
            <Wifi
              className={`${ICON_SM} text-[var(--tx-dim)]`}
              strokeWidth={ICON}
            />
          ) : (
            <WifiOff
              className={`${ICON_SM} text-[var(--tx-dim)]`}
              strokeWidth={ICON}
            />
          )}
          <span className={`text-[11px] font-semibold ${TX.dim}`}>
            {networkLabel()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function RescuePage() {
  const [screen, setScreen] = useState<Screen>("idle");
  const [showTextInput, setShowTextInput] = useState(false);
  const [peopleCount, setPeopleCount] = useState(1);
  const [messageText, setMessageText] = useState("");
  const [lastRequest, setLastRequest] = useState<RescueRequest | null>(null);
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([]);
  const [priorityScore, setPriorityScore] = useState(0);
  const [currentTime, setCurrentTime] = useState("");
  const {
    isConnected: isAgoraConnected,
    isAgentSpeaking,
    messageList: agoraMessageList,
    currentInProgressMessage,
    joinChannel,
    leaveChannel,
    toggleMute,
  } = useAgoraVoiceClient();

  const textInputRef = useRef<HTMLDivElement>(null);

  // Scroll text input overlay to top when it appears
  useEffect(() => {
    if (showTextInput && textInputRef.current) {
      // Use requestAnimationFrame to ensure the DOM is rendered before scrolling
      requestAnimationFrame(() => {
        if (textInputRef.current) {
          textInputRef.current.scrollTop = 0;
        }
      });
    }
  }, [showTextInput]);

  const { agentState, startTriage, resetAgent, processInput } =
    useTriageAgent();

  const {
    coords,
    status: gpsStatus,
    capture: captureLocation,
  } = useGeolocation();
  const { online, type: connectionType, effectiveType } = useOnlineStatus();
  const { canInstall, install: installPWA } = usePWAInstall();

  const submitRequest = (
    keywords: string[],
    priority: number,
    message: string,
  ) => {
    const finalPriority = Math.min(priority + (peopleCount > 1 ? 1 : 0), 5);
    const status: RescueStatus = finalPriority >= 4 ? "critical" : "waiting";
    const request: RescueRequest = {
      id: generateRequestId(),
      lat: coords?.lat || 14.5995,
      lng: coords?.lng || 120.9842,
      message: message || "Emergency assistance requested",
      status,
      priority: finalPriority,
      peopleCount,
      distressKeywords: keywords,
      createdAt: new Date().toISOString(),
    };
    publishRequest(request);
    setLastRequest(request);
    setScreen(online ? "confirmed" : "offline-queued");

    toast.custom(
      () => (
        <div className={`${NM} w-full px-4 py-3.5 flex items-center gap-3`}>
          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
            <span className="text-sm font-semibold text-[var(--tx-title)]">
              {online ? "Request sent!" : "Queued offline"}
            </span>
            <span className="text-xs font-semibold text-[var(--tx-dim)]">
              {online
                ? `Help is on the way · ${request.id}`
                : "Will send when signal returns"}
            </span>
          </div>
          <span className="text-xs font-semibold text-[var(--tx-brand)] shrink-0">
            {online ? "✓ Live" : "Pending"}
          </span>
        </div>
      ),
      { duration: 4000 },
    );

    setMessageText("");
    setShowTextInput(false);
  };

  // Process final user transcripts from Agora MessageEngine → triage state machine
  useEffect(() => {
    if (!agoraMessageList.length) return;
    const latest = agoraMessageList[agoraMessageList.length - 1];
    // uid !== 0 means it's the user's own STT transcript (agent is uid 0)
    if (latest.uid !== 0 && latest.text && latest.status === 1) {
      const intent = detectIntent(latest.text);
      setDetectedKeywords(intent.detectedKeywords);
      setPriorityScore(intent.priority);
      setMessageText((p) => (p ? `${p} ${latest.text}` : latest.text));
      processInput(latest.text, true);
    }
  }, [agoraMessageList, processInput]);

  // React to triage state machine reaching a decision
  useEffect(() => {
    if (agentState.stage === "broadcast" && messageText) {
      submitRequest(detectedKeywords, priorityScore, messageText);
      resetAgent();
    } else if (agentState.stage === "unverified") {
      setScreen("idle");
      resetAgent();
    }
    if (agentState.peopleCount) setPeopleCount(agentState.peopleCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentState.stage, agentState.peopleCount]);

  const joinAgoraSession = async () => {
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const channel = process.env.NEXT_PUBLIC_AGORA_CHANNEL;
    const token = process.env.NEXT_PUBLIC_AGORA_TOKEN || null;
    const uid = parseInt(process.env.NEXT_PUBLIC_AGORA_UID || "0");

    if (!appId || !channel) {
      toast.error(
        "Agora App ID and Channel are required in environment variables",
      );
      return;
    }

    try {
      // Capture fresh location when starting rescue
      captureLocation();
      await joinChannel();
    } catch (error) {
      const message =
        error instanceof Error ? `${error.message}` : JSON.stringify(error);
      console.error("Agora join error", error);
      toast.error(`Could not join Agora channel: ${message}`);
    }
  };

  const leaveAgoraSession = async () => {
    await leaveChannel();
    resetAgent();
  };

  const toggleAgoraMute = async () => {
    await toggleMute();
  };

  useEffect(() => {
    const tick = () =>
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Latest transcript to show in the listening screen (user speech, uid !== 0)
  const liveTranscript = agoraMessageList.length
    ? agoraMessageList[agoraMessageList.length - 1]?.uid !== 0
      ? agoraMessageList[agoraMessageList.length - 1]?.text
      : ""
    : "";

  // Use interim transcript for real-time feedback
  const displayTranscript = currentInProgressMessage || liveTranscript || "";

  // Update priority and keywords based on current interim transcript
  useEffect(() => {
    if (displayTranscript && screen === "listening") {
      const intent = detectIntent(displayTranscript);
      setDetectedKeywords(intent.detectedKeywords);
      setPriorityScore(intent.priority);
      setMessageText(displayTranscript);
    }
  }, [displayTranscript, screen]);

  // Transition to confirmed when user's voice message is finalized
  useEffect(() => {
    if (screen === "listening" && agoraMessageList.length > 0) {
      const lastMessage = agoraMessageList[agoraMessageList.length - 1];
      // Check if last message is from user (uid === 1)
      if (lastMessage?.uid === 1) {
        console.log("Message finalized, transitioning to confirmed screen");
        setScreen("confirmed");
        // Create RescueRequest with current state and actual location
        const request: RescueRequest = {
          id: `req_${Date.now()}`,
          lat: coords?.lat || 0,
          lng: coords?.lng || 0,
          message: lastMessage.text,
          status: "waiting",
          priority: priorityScore,
          peopleCount,
          distressKeywords: detectedKeywords,
          createdAt: new Date().toISOString(),
        };
        setLastRequest(request);
        // Publish the help request
        publishRequest(request);
        leaveChannel(); // Stop listening
      }
    }
  }, [
    agoraMessageList,
    screen,
    detectedKeywords,
    priorityScore,
    peopleCount,
    coords,
  ]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMessageText(text);
    const r = detectIntent(text);
    setDetectedKeywords(r.detectedKeywords);
    setPriorityScore(r.priority);
  };

  const resetFlow = () => {
    setScreen("idle");
    setShowTextInput(false);
    setMessageText("");
    setPeopleCount(1);
    setDetectedKeywords([]);
    setPriorityScore(0);
    setLastRequest(null);
  };

  // ── LISTENING ──────────────────────────────────────────────────────────────
  const listeningContent = (
    <div
      className={`${PAGE} flex-1 items-center justify-center gap-6 py-10 overflow-hidden z-20`}
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5">
          {/* Modern Radar-Ping Status Dot */}
          <span
            className={`relative flex h-2.5 w-2.5 shrink-0 ${
              isAgoraConnected ? "text-[var(--tx-brand)]" : "text-gray-400"
            }`}
          >
            {isAgoraConnected && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40"></span>
            )}
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current transition-colors duration-300"></span>
          </span>

          {/* Refined Typography Hierarchy */}
          <span
            className={`text-[15px] tracking-tight transition-colors duration-300 ${
              isAgoraConnected ? "text-[var(--tx-brand)]" : "text-gray-500"
            }`}
          >
            {isAgoraConnected ? (
              <>
                {/* Primary Language gets the visual weight */}
                <strong className="font-bold">Nakikinig</strong>

                {/* Subtle separator */}
                <span className="mx-1.5 font-light opacity-40">/</span>

                {/* Secondary Language is softer */}
                <span className="font-medium opacity-80">Listening</span>
              </>
            ) : (
              <span className="font-medium animate-pulse">Connecting...</span>
            )}
          </span>
        </div>
      </div>
      <div className={`${NM} p-5 flex items-center justify-center w-full`}>
        <SiriWave active={!isAgentSpeaking} />
      </div>
      <div
        className={`${NMI} w-full px-5 py-4 min-h-[68px] flex items-center justify-center flex-col gap-2`}
      >
        {isAgentSpeaking && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--tx-brand)] animate-pulse">
            Agent Speaking...
          </span>
        )}
        <p className={`${TX.body} italic text-center leading-relaxed`}>
          {displayTranscript ||
            agentState.transcript ||
            "Waiting for your voice…"}
        </p>
        {/* Real-time keywords display */}
        {detectedKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {detectedKeywords.slice(0, 3).map((keyword, idx) => (
              <span
                key={idx}
                className="text-xs bg-[var(--tx-brand)]/10 text-[var(--tx-brand)] px-2.5 py-1 rounded-full font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}
        {/* Priority display */}
        {priorityScore > 0 && (
          <span
            className={`text-xs font-bold mt-1 ${
              priorityScore >= 4
                ? "text-red-500"
                : priorityScore >= 2
                  ? "text-orange-500"
                  : "text-green-500"
            }`}
          >
            Priority: {priorityScore}/5
          </span>
        )}
      </div>
      <p className={`${TX.dim} text-center`}>
        {agentState.stage === "listening-distress" &&
          "Describe your emergency..."}
        {agentState.stage === "q1-location" && "State your location..."}
        {agentState.stage === "q2-people" && "How many people?"}
        {agentState.stage === "q3-water" && "Water level?"}
        {agentState.stage === "idle" && "Speak clearly..."}
      </p>
      <button
        className={`${NM_BTN} flex items-center gap-2 px-8 py-4 rounded-2xl`}
        onClick={() => {
          resetAgent();
          setScreen("idle");
        }}
      >
        <X className={`${ICON_SM} text-[var(--tx-body)]`} strokeWidth={ICON} />
        <span className={TX.body}>Cancel</span>
      </button>
    </div>
  );

  // ── CONFIRMED ──────────────────────────────────────────────────────────────
  const confirmedContent = lastRequest ? (
    <div className={`${PAGE} flex-1 gap-4 py-8 overflow-hidden z-20`}>
      <StatusBar
        currentTime={currentTime}
        gpsStatus={gpsStatus}
        online={online}
        connectionType={connectionType}
        effectiveType={effectiveType}
      />
      <div className="flex flex-col items-center text-center gap-3 py-4">
        <div className={`${NM} p-5 rounded-full`}>
          <CircleCheckBig
            className={`${ICON_LG} text-[var(--tx-brand)]`}
            strokeWidth={ICON}
          />
        </div>
        <h1 className={TX.title}>Naipadala na!</h1>
        <p className={TX.muted}>Help is on the way. Stay calm and stay put.</p>
      </div>
      <div className={`${NM} p-5 flex flex-col gap-4`}>
        <div className="flex flex-col gap-3 pb-4 border-b border-[var(--tx-dim)]/20">
          <span className={TX.label}>Your Message</span>
          <p className={`${TX.body} text-left leading-relaxed`}>
            "{lastRequest.message}"
          </p>
          {lastRequest.distressKeywords &&
            lastRequest.distressKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {lastRequest.distressKeywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-[var(--tx-brand)]/10 text-[var(--tx-brand)] px-2.5 py-1 rounded-full font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            )}
        </div>
        <div className="flex justify-between items-center">
          <span className={TX.dim}>Request ID</span>
          <span className={TX.mono}>#{lastRequest.id}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className={TX.body}>Status</span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--tx-brand)]/10 text-[var(--tx-brand)]">
            {lastRequest.status.toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className={TX.label}>Priority</span>
            <span className={TX.mono}>{lastRequest.priority}/5</span>
          </div>
          <div className={`${NMI} p-1.5`}>
            <Progress
              value={(lastRequest.priority / 5) * 100}
              className="h-2 bg-transparent"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={`${NMI} p-3 flex flex-col gap-1.5`}>
            <div className="flex items-center gap-1.5">
              <LocateFixed
                className={`${ICON_SM} text-[var(--tx-dim)]`}
                strokeWidth={ICON}
              />
              <span className={TX.dim}>Location</span>
            </div>
            <span className={TX.dim}>
              {lastRequest.lat.toFixed(4)}, {lastRequest.lng.toFixed(4)}
            </span>
          </div>
          <div className={`${NMI} p-3 flex flex-col gap-1.5`}>
            <div className="flex items-center gap-1.5">
              <UsersRound
                className={`${ICON_SM} text-[var(--tx-dim)]`}
                strokeWidth={ICON}
              />
              <span className={TX.dim}>People</span>
            </div>
            <span className="font-mono text-lg font-semibold text-[var(--tx-mono)]">
              {lastRequest.peopleCount}
            </span>
          </div>
        </div>
      </div>
      <div className={`${NM} p-4 flex gap-3 items-start`}>
        <ShieldAlert
          className={`${ICON_MD} text-[var(--tx-dim)] shrink-0 mt-0.5`}
          strokeWidth={ICON}
        />
        <div className="flex flex-col gap-1">
          <span className={TX.heading}>Manatili sa pwesto</span>
          <span className={TX.dim}>
            Stay in your current location unless unsafe.
          </span>
        </div>
      </div>
      <button
        className={`${NM_BTN} w-full py-4 flex items-center justify-center gap-2 rounded-2xl`}
        onClick={resetFlow}
      >
        <PhoneCall
          className={`${ICON_SM} text-[var(--tx-body)]`}
          strokeWidth={ICON}
        />
        <span className={TX.body}>Send another request</span>
      </button>
    </div>
  ) : null;

  // ── OFFLINE QUEUED ─────────────────────────────────────────────────────────
  const offlineQueuedContent = lastRequest ? (
    <div className={`${PAGE} flex-1 gap-4 py-8 overflow-hidden z-20`}>
      <StatusBar
        currentTime={currentTime}
        gpsStatus={gpsStatus}
        online={online}
        connectionType={connectionType}
        effectiveType={effectiveType}
      />
      <div className={`${NM} p-4 flex gap-3 items-start`}>
        <WifiOff
          className={`${ICON_MD} text-[var(--tx-brand)] shrink-0 mt-0.5`}
          strokeWidth={ICON}
        />
        <div className="flex flex-col gap-1">
          <span className={TX.heading}>Walang Signal</span>
          <span className={TX.dim}>
            Request queued — will send automatically when online.
          </span>
        </div>
      </div>
      <div className={`${NM} p-5 flex flex-col gap-4`}>
        <div className="flex justify-between items-center">
          <span className={TX.mono}>#{lastRequest.id}</span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--tx-brand)]/10 text-[var(--tx-brand)]">
            QUEUED
          </span>
        </div>
        <div className="flex items-center gap-2">
          <LocateFixed
            className={`${ICON_SM} text-[var(--tx-dim)]`}
            strokeWidth={ICON}
          />
          <span className={TX.dim}>GPS coordinates captured</span>
        </div>
        <div className={`${NMI} p-3 flex flex-col gap-2`}>
          <span className={TX.monoSm}>
            {lastRequest.lat.toFixed(4)}, {lastRequest.lng.toFixed(4)}
          </span>
          <div className="flex items-center gap-1.5">
            <UsersRound
              className={`${ICON_SM} text-[var(--tx-dim)]`}
              strokeWidth={ICON}
            />
            <span className={TX.dim}>
              {lastRequest.peopleCount}{" "}
              {lastRequest.peopleCount === 1 ? "person" : "people"}
            </span>
          </div>
        </div>
      </div>
      <div className={`${NM} p-4 flex gap-3 items-start`}>
        <TriangleAlert
          className={`${ICON_MD} text-[var(--tx-dim)] shrink-0 mt-0.5`}
          strokeWidth={ICON}
        />
        <div className="flex flex-col gap-1">
          <span className={TX.heading}>Huwag isara ang app</span>
          <span className={TX.dim}>
            Keep the app open to send when signal returns.
          </span>
        </div>
      </div>
      <button
        className={`${NM_BTN} w-full py-4 flex items-center justify-center gap-2 rounded-2xl`}
        onClick={resetFlow}
      >
        <PhoneCall
          className={`${ICON_SM} text-[var(--tx-body)]`}
          strokeWidth={ICON}
        />
        <span className={TX.body}>Try again</span>
      </button>
    </div>
  ) : null;

  // ── IDLE ───────────────────────────────────────────────────────────────────
  // Render appropriate screen based on state
  const screenContent =
    screen === "listening"
      ? listeningContent
      : screen === "confirmed"
        ? confirmedContent
        : screen === "offline-queued"
          ? offlineQueuedContent
          : null;
  // Outer div is relative + h-dvh so the overlay's absolute inset-0 anchors
  // to the visible shell height, not the scrollable content height.
  return (
    <div className="relative w-full flex flex-col z-0">
      <Toaster />

      {/* ── Text Input Overlay ── */}
      {showTextInput && (
        <div
          ref={textInputRef}
          className="absolute inset-0 bg-[var(--app-bg)] z-50 flex flex-col overflow-y-auto animate-in slide-in-from-bottom-full duration-300 pt-9 pb-12 px-5"
        >
          <div className="flex justify-between items-start shrink-0">
            <div className="flex flex-col gap-0.5">
              <h2 className={TX.title}>Describe the emergency</h2>
              <p className={TX.dim}>Ano ang nangyayari?</p>
            </div>
            <button
              aria-label="Close text input"
              className={`w-11 h-11 rounded-full ${NM_BTN} flex items-center justify-center shrink-0`}
              onClick={() => setShowTextInput(false)}
            >
              <X
                className={`${ICON_SM} text-[var(--tx-body)]`}
                strokeWidth={ICON}
              />
            </button>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-h-0 mt-4">
            <div className={`${NMI} p-1 flex-1 flex flex-col min-h-0`}>
              <Textarea
                id="emergency-message"
                aria-describedby="char-counter"
                value={messageText}
                onChange={handleTextChange}
                placeholder="e.g. Flood on the roof, someone is injured, need immediate help…"
                className="flex-1 h-full text-sm font-semibold bg-transparent border-none shadow-none text-[var(--tx-body)] placeholder:text-[var(--tx-dim)] placeholder:font-normal rounded-xl resize-none focus-visible:ring-0"
                maxLength={300}
              />
            </div>
            <div
              id="char-counter"
              className="flex justify-between px-1 shrink-0"
            >
              <span
                className={`text-xs font-semibold ${messageText.length > 250 ? "text-[var(--tx-brand)]" : "text-[var(--tx-dim)]"}`}
              >
                {messageText.length}/300
              </span>
              <span className={TX.dim}>
                {detectedKeywords.length} keywords detected
              </span>
            </div>
          </div>

          {detectedKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 shrink-0 mt-3">
              {detectedKeywords.map((k) => (
                <span
                  key={k}
                  className={`${NM} text-xs font-semibold px-3 py-1.5 text-[var(--tx-brand)]`}
                >
                  {k}
                </span>
              ))}
            </div>
          )}

          {priorityScore > 0 && (
            <div className="flex flex-col gap-2 shrink-0 mt-3">
              <div className="flex justify-between px-1">
                <span className={TX.dim}>Priority Level</span>
                <span className={TX.monoSm}>{priorityScore}/5</span>
              </div>
              <div className={`${NMI} p-1.5`}>
                <Progress
                  value={(priorityScore / 5) * 100}
                  className="h-2 bg-transparent"
                  aria-label="Priority level"
                  aria-valuenow={priorityScore}
                />
              </div>
            </div>
          )}

          <button
            className={`w-full py-4 rounded-2xl text-sm font-semibold text-white cursor-pointer shrink-0 mt-4
              transition-all duration-150 ease-out select-none bg-[var(--tx-brand)]
              ${messageText.trim().length === 0 ? "opacity-40 cursor-not-allowed" : "active:scale-[0.97] active:opacity-90"}`}
            disabled={messageText.trim().length === 0}
            onClick={() =>
              submitRequest(detectedKeywords, priorityScore, messageText)
            }
          >
            Request Rescue · Humingi ng Saklolo
          </button>
        </div>
      )}

      {/* ── Render appropriate screen or main idle content ── */}
      {screenContent || (
        <div className={`${PAGE} flex-1 overflow-y-auto pb-8 z-20`}>
          <StatusBar
            currentTime={currentTime}
            gpsStatus={gpsStatus}
            online={online}
            connectionType={connectionType}
            effectiveType={effectiveType}
          />

          {canInstall && (
            <div className={`${NM} p-4 flex items-center gap-3 mb-1`}>
              <Download
                className={`${ICON_SM} text-[var(--tx-dim)] shrink-0`}
                strokeWidth={ICON}
              />
              <span className={`${TX.body} flex-1`}>
                Install AGAP for faster access
              </span>
              <button
                onClick={installPWA}
                className="text-xs font-semibold text-[var(--tx-brand)] cursor-pointer active:opacity-70"
              >
                Install
              </button>
            </div>
          )}

          <div className="pt-5 pb-2">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--tx-title)] leading-snug">
              Humingi ng Tulong
            </h1>
            <p className={`${TX.muted} mt-1`}>
              Request emergency help — voice or text
            </p>
          </div>

          <div className={`${NM} w-full flex justify-center py-8 mt-2`}>
            <PixelSOSButton
              sublabel="Tap to speak"
              onClick={() => {
                setScreen("listening");
                startTriage();
                joinAgoraSession();
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className={`${NM} p-3 flex flex-col items-center gap-1.5`}>
              <UsersRound
                className={`${ICON_SM} text-[var(--tx-dim)]`}
                strokeWidth={ICON}
              />
              <span
                className="font-mono text-lg font-semibold text-[var(--tx-mono)]"
                aria-live="polite"
              >
                {peopleCount}
              </span>
              <span className={TX.dim}>People</span>
            </div>
            <div className={`${NM} p-3 flex flex-col items-center gap-1.5`}>
              <Gauge
                className={`${ICON_SM} text-[var(--tx-dim)]`}
                strokeWidth={ICON}
              />
              <span className="font-mono text-lg font-semibold text-[var(--tx-mono)]">
                {priorityScore}/5
              </span>
              <span className={TX.dim}>Priority</span>
            </div>
            <div className={`${NM} p-3 flex flex-col items-center gap-1.5`}>
              <LocateFixed
                className={`${ICON_SM} text-[var(--tx-dim)]`}
                strokeWidth={ICON}
              />
              <span className="font-mono text-lg font-semibold text-[var(--tx-mono)]">
                {gpsStatus === "ready" ? "Ready" : "…"}
              </span>
              <span className={TX.dim}>GPS</span>
            </div>
          </div>

          <div
            className={`${NM} w-full p-4 flex items-center justify-between mt-4`}
          >
            <div className="flex flex-col gap-0.5">
              <span className={TX.heading}>People in need</span>
              <span className={TX.dim}>Bilang ng tao</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                aria-label="Decrease people count"
                className={`w-11 h-11 rounded-full ${NM_BTN} flex items-center justify-center disabled:opacity-30`}
                onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                disabled={peopleCount <= 1}
              >
                <Minus
                  className={`${ICON_SM} text-[var(--tx-body)]`}
                  strokeWidth={ICON}
                />
              </button>
              <span
                className="font-mono text-xl font-semibold text-[var(--tx-mono)] w-6 text-center"
                aria-live="polite"
              >
                {peopleCount}
              </span>
              <button
                aria-label="Increase people count"
                className={`w-11 h-11 rounded-full ${NM_BTN} flex items-center justify-center`}
                onClick={() => setPeopleCount(peopleCount + 1)}
              >
                <Plus
                  className={`${ICON_SM} text-[var(--tx-body)]`}
                  strokeWidth={ICON}
                />
              </button>
            </div>
          </div>

          <button
            className={`${NM_BTN} w-full py-4 flex items-center justify-center gap-2 rounded-2xl mt-4`}
            onClick={() => setShowTextInput(true)}
          >
            <PenLine
              className={`${ICON_SM} text-[var(--tx-dim)]`}
              strokeWidth={ICON}
            />
            <span className={TX.body}>Type your message instead</span>
          </button>

          <p className={`${TX.dim} text-center mt-4 px-2`}>
            Tap SOS and speak your emergency clearly.
            <br />
            Hinay-hinay, kalmado lang.
          </p>
        </div>
      )}
    </div>
  );
}
