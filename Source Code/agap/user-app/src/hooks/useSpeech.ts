import { useState, useRef, useCallback, useEffect } from 'react';
import { detectIntent } from '@/lib/intentDetect';

interface SpeechState {
  listening: boolean;
  error: string | null;
  transcript: string;
}

export function useSpeech(onResult: (result: { isEmergency: boolean; priority: number; detectedKeywords: string[] }, finalTranscript: string) => void) {
  const [state, setState] = useState<SpeechState>({
    listening: false,
    error: null,
    transcript: '',
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Defer state update
      const timer = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          error: 'Browser does not support speech recognition / Hindi suportado ang speech recognition',
        }));
      }, 0);
      return () => clearTimeout(timer);
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fil-PH';
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    recognition.onstart = () => {
      setState((prev) => ({ ...prev, listening: true, error: null }));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const finalTranscript = event.results[i][0].transcript;
          const intent = detectIntent(finalTranscript);
          onResult(intent, finalTranscript);
          setState((prev) => ({ ...prev, transcript: finalTranscript }));
        } else {
          interimTranscript += event.results[i][0].transcript;
          setState((prev) => ({ ...prev, transcript: interimTranscript }));
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        // Silent error
        return;
      }
      let errorMessage = 'Error occurred in recognition / Nagkaroon ng error sa pagkilala';
      if (event.error === 'not-allowed') {
        errorMessage = 'Microphone permission denied / Ipinagkait ang pahintulot sa mikropono';
      }
      setState((prev) => ({ ...prev, error: errorMessage, listening: false }));
    };

    recognition.onend = () => {
      setState((prev) => ({ ...prev, listening: false }));
    };

    recognitionRef.current = recognition;
  }, [onResult]);

  const start = useCallback(() => {
    if (recognitionRef.current) {
      try {
        // If already started, this might throw. We can check state.listening but that's in state.
        // Better to just try/catch or check the object.
        recognitionRef.current.start();
      } catch (e) {
        // ignore "already started" errors
        // console.warn('Speech recognition start warning:', e);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { ...state, start, stop };
}
