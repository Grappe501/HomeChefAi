import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionErrorEvent extends Event {
  error?: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function useSpeechRecognition(
  onResult: (text: string) => void,
  onError?: (message: string) => void,
) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  }, [onResult, onError]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR);
    if (!SR) return;

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) onResultRef.current(transcript);
      setListening(false);
    };
    rec.onerror = (event) => {
      setListening(false);
      const code = (event as SpeechRecognitionErrorEvent).error;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        onErrorRef.current?.('Microphone access denied. Allow mic in browser settings or type your message.');
      } else if (code !== 'aborted' && code !== 'no-speech') {
        onErrorRef.current?.('Voice input failed. Try typing instead.');
      }
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const start = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec || listening) return;
    try {
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
      onErrorRef.current?.('Could not start voice input. Try typing instead.');
    }
  }, [listening]);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
}
