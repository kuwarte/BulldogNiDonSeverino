"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, PhoneOff, SendHorizontal } from "lucide-react";
import { useAgoraVoiceClient } from "@/hooks/useAgoraVoiceClient"; // Keep for compatibility
import { useAudioVisualization } from "@/hooks/useAudioVisualization";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const DEFAULT_BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8082";
const DEFAULT_PROFILE = process.env.NEXT_PUBLIC_DEFAULT_PROFILE || "VOICE";

export function VoiceClient() {
  const [chatMessage, setChatMessage] = useState("");
  const conversationRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    isMuted,
    micState,
    messageList,
    currentInProgressMessage,
    isAgentSpeaking,
    isSpeaking,
    joinChannel,
    leaveChannel,
    toggleMute,
    sendMessage,
  } = useAgoraVoiceClient();

  // System prompt for context
  const SYSTEM_CONTEXT =
    "You are a helpful emergency rescue assistant. Keep responses brief and actionable. Current location: Emergency Zone. User urgency level: High.";

  // Remove Agora auto-connect logic
  useEffect(() => {
    joinChannel();
  }, []);

  // Remove audio visualization for mimic

  const handleStop = async () => {
    await leaveChannel();
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !isConnected) return;

    sendMessage(chatMessage);
    setChatMessage("");
  };

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 px-4 py-3 md:py-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold">
              🎙️ Agora Voice Agent
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Real-time voice communication powered by Agora RTC
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 px-4 py-6 min-h-0 overflow-hidden min-w-0">
        {/* Always show connected layout (auto-connects on mount) */}
        <div className="flex flex-1 flex-col gap-4 min-h-0 overflow-hidden md:flex-row md:gap-6">
          {/* Mobile: Compact Agent Status Bar */}
          <div className="flex items-center justify-center rounded-lg border bg-card p-3 shadow-lg md:hidden">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-3 w-3 rounded-full",
                  isAgentSpeaking || isSpeaking
                    ? "bg-green-500 animate-pulse"
                    : "bg-blue-500",
                )}
              />
              <span className="text-sm font-medium">
                {isAgentSpeaking || isSpeaking
                  ? "Agent Speaking (Voice)"
                  : "Listening"}
              </span>
            </div>
          </div>

          {/* Desktop: Left Column (visualizer + controls) */}
          <div className="hidden md:flex md:w-96 flex-col gap-6 self-stretch">
            {/* Agent Status */}
            <div className="rounded-lg border bg-card p-6 shadow-lg flex-shrink">
              <div
                className={cn(
                  "h-16 w-16 rounded-full mx-auto flex items-center justify-center text-2xl transition-all",
                  isConnected
                    ? isAgentSpeaking || isSpeaking
                      ? "bg-green-500/20 animate-pulse"
                      : "bg-blue-500/20"
                    : "bg-gray-500/20",
                )}
              >
                {isConnected ? "🎙️" : "📵"}
              </div>
              <p className="mt-4 text-sm text-center font-medium">
                {!isConnected
                  ? "Not Connected"
                  : isAgentSpeaking || isSpeaking
                    ? "Agent Speaking (Voice)"
                    : "Agent Listening"}
              </p>
            </div>

            {/* Controls */}
            <div className="rounded-lg border bg-card p-6 shadow-lg">
              <div className="flex gap-3 justify-center flex-wrap">
                <button
                  onClick={toggleMute}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                    isMuted
                      ? "bg-muted text-destructive hover:bg-muted/80"
                      : "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  {isMuted ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  {isMuted ? "Unmute" : "Mute"}
                </button>
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                >
                  <PhoneOff className="h-4 w-4" />
                  End Call
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="rounded-lg border bg-card p-4 shadow-lg flex-1 flex flex-col justify-center">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mic:</span>
                  <span className="font-mono font-medium">
                    {isMuted ? "Muted" : "Active"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-mono font-medium">
                    {isConnected ? "Connected" : "Disconnected"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Conversation */}
          <div
            ref={conversationRef}
            className="flex flex-1 flex-col min-h-0 overflow-hidden rounded-lg border bg-card shadow-lg"
          >
            {/* Conversation Header */}
            <div className="border-b p-4 flex-shrink-0">
              <h2 className="font-semibold">Conversation</h2>
              <p className="text-sm text-muted-foreground">
                {messageList.length} message
                {messageList.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto space-y-3 p-4">
              {messageList.map((msg, idx) => {
                const isAgent = msg.uid === 0;
                const label = isAgent ? "Agent" : "You";
                return (
                  <div
                    key={`${msg.turn_id}-${idx}`}
                    className={cn(
                      "rounded-lg px-4 py-3 max-w-xs",
                      isAgent
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground ml-auto",
                    )}
                  >
                    <p className="text-xs font-medium opacity-70 mb-1">
                      {label}
                    </p>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Input Box */}
            <div className="border-t p-3 md:p-4 flex-shrink-0">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type a message"
                  disabled={!isConnected}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!isConnected || !chatMessage.trim()}
                  className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile: Fixed Bottom Controls */}
          <div className="flex md:hidden gap-3 p-4 border-t bg-card justify-center items-center">
            <button
              onClick={toggleMute}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                isMuted
                  ? "bg-muted text-destructive hover:bg-muted/80"
                  : "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {isMuted ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleStop}
              className="cursor-pointer flex items-center gap-2 rounded-lg bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
            >
              <PhoneOff className="h-4 w-4" />
              End Call
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
