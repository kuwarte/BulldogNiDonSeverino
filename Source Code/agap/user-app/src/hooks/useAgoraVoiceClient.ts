"use client";

import { useState, useRef, useEffect } from "react";

type SpeechRecognitionType = {
  new (): any;
};

export function useAgoraVoiceClient() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [micState, setMicState] = useState("inactive");
  const [messageList, setMessageList] = useState<any[]>([]);
  const [currentInProgressMessage, setCurrentInProgressMessage] = useState<
    any | null
  >(null);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [context, setContext] = useState("");

  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const SILENCE_THRESHOLD = 2000; // 2 seconds of silence to consider speech ended

  // Initialize Web Speech API (only once on component mount)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.error("Web Speech API not supported in this browser");
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "fil-PH"; // Filipino

      recognitionRef.current.onstart = () => {
        console.log("Speech recognition started");
        setIsSpeaking(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        // Clear existing silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // Update current message with transcript
        if (finalTranscript || interimTranscript) {
          console.log(
            "Transcript detected:",
            finalTranscript || interimTranscript,
          );
          setCurrentInProgressMessage(finalTranscript || interimTranscript);
        }

        // If there's a final transcript, set a timeout to consider speech ended after silence
        if (finalTranscript) {
          silenceTimeoutRef.current = setTimeout(() => {
            const transcript = finalTranscript.trim();
            if (transcript && recognitionRef.current) {
              console.log("Finalizing message:", transcript);
              // Add the final message to messageList
              const msg = {
                uid: 1,
                turn_id: Math.random().toString(),
                text: transcript,
                status: 1,
              };
              setMessageList((prev) => [...prev, msg]);
              setCurrentInProgressMessage(null);
            }
          }, SILENCE_THRESHOLD);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };

      recognitionRef.current.onend = () => {
        console.log("Speech recognition ended");
        setIsSpeaking(false);
      };
    }

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const joinChannel = async () => {
    setIsConnected(true);
    setMicState("active");

    // Start listening for voice
    if (recognitionRef.current) {
      try {
        // First, ensure any previous recognition is stopped
        recognitionRef.current.stop();

        // Small delay to ensure the previous session fully stops
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.start();
            console.log("Speech recognition started");
          }
        }, 100);
      } catch (err) {
        console.error("Failed to start recognition:", err);
      }
    }
  };

  const leaveChannel = async () => {
    setIsConnected(false);
    setMicState("inactive");
    setMessageList([]);
    setCurrentInProgressMessage(null);
    setIsSpeaking(false);

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
  };

  const toggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (newMuted) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setMicState("muted");
    } else {
      if (recognitionRef.current && isConnected) {
        recognitionRef.current.start();
      }
      setMicState("active");
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const msg = {
      uid: 1,
      turn_id: Math.random().toString(),
      text,
      status: 1,
    };
    setMessageList((prev) => [...prev, msg]);
    setCurrentInProgressMessage(null);

    setTimeout(() => {
      const agentMsg = {
        uid: 0,
        turn_id: Math.random().toString(),
        text: "Message received. Processing your request...",
        status: 1,
      };
      setMessageList((prev) => [...prev, agentMsg]);
      setIsAgentSpeaking(false);
    }, 1200);
  };

  const sendContext = (ctx: string) => {
    setContext(ctx);
  };

  return {
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
    sendContext,
    context,
  };
}
