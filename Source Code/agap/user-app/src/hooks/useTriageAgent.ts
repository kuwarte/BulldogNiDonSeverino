import { useState, useCallback } from "react";
import {
  detectIntent,
  detectLocation,
  detectPeopleCount,
  detectWaterLevel,
} from "@/lib/intentDetect";

export type AgentStage =
  | "idle"
  | "listening-distress"
  | "q1-location"
  | "q2-people"
  | "q3-water"
  | "broadcast"
  | "unverified";

interface TriageAgentState {
  stage: AgentStage;
  transcript: string;
  location: string | null;
  peopleCount: number | null;
  waterLevel: string | null;
  confidence: number;
}

export function useTriageAgent() {
  const [state, setState] = useState<TriageAgentState>({
    stage: "idle",
    transcript: "",
    location: null,
    peopleCount: null,
    waterLevel: null,
    confidence: 0,
  });

  const resetAgent = useCallback(() => {
    setState({
      stage: "idle",
      transcript: "",
      location: null,
      peopleCount: null,
      waterLevel: null,
      confidence: 0,
    });
  }, []);

  const startTriage = useCallback(() => {
    setState((s) => ({ ...s, stage: "listening-distress", confidence: 0 }));
  }, []);

  // Driven by transcripts coming from Agora MessageEngine (user speech STT)
  const processInput = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (!transcript.trim() || !isFinal) return;

      setState((s) => {
        const intent = detectIntent(transcript);

        switch (s.stage) {
          case "listening-distress":
            if (
              intent.isEmergency ||
              intent.priority > 0 ||
              transcript.split(" ").length > 2
            ) {
              return {
                ...s,
                transcript,
                stage: "q1-location",
                confidence: Math.max(s.confidence, 3),
              };
            }
            return { ...s, transcript };

          case "q1-location":
            if (detectLocation(transcript)) {
              return {
                ...s,
                transcript,
                location: transcript,
                stage: "q2-people",
                confidence: s.confidence + 2,
              };
            }
            return { ...s, transcript };

          case "q2-people": {
            const count = detectPeopleCount(transcript);
            if (count !== null) {
              return {
                ...s,
                transcript,
                peopleCount: count,
                stage: "q3-water",
                confidence: s.confidence + 2,
              };
            }
            return { ...s, transcript };
          }

          case "q3-water": {
            const level = detectWaterLevel(transcript);
            if (level || intent.detectedKeywords.length > 0) {
              const finalConfidence =
                s.confidence + (level ? 3 : 1);
              return {
                ...s,
                transcript,
                waterLevel: level || "unknown",
                confidence: Math.min(10, finalConfidence),
                stage: finalConfidence >= 5 ? "broadcast" : "unverified",
              };
            }
            return { ...s, transcript };
          }

          default:
            return { ...s, transcript };
        }
      });
    },
    [],
  );

  return { agentState: state, startTriage, resetAgent, processInput };
}
