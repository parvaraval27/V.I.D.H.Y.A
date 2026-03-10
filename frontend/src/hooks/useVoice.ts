import { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceState {
  isListening: boolean;
  transcript: string;
  isSpeaking: boolean;
  isSupported: boolean;
  autoSpeak: boolean;
}

const STORAGE_KEY = 'vidhya-voice-prefs';

function loadPrefs(): { autoSpeak: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { autoSpeak: true };
}

function savePrefs(prefs: { autoSpeak: boolean }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function useVoice() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [state, setState] = useState<VoiceState>(() => {
    const prefs = loadPrefs();
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    return {
      isListening: false,
      transcript: '',
      isSpeaking: false,
      isSupported: !!SpeechRecognition && !!window.speechSynthesis,
      autoSpeak: prefs.autoSpeak,
    };
  });

  // Clean up on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const startListening = useCallback((onResult?: (text: string) => void) => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Stop any existing session
    recognitionRef.current?.abort();

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const current = finalTranscript || interimTranscript;
      setState(prev => ({ ...prev, transcript: current }));

      if (finalTranscript) {
        onResult?.(finalTranscript.trim());
      }
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
      recognitionRef.current = null;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // 'no-speech' and 'aborted' are expected, don't treat them as errors
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[Voice] Recognition error:', event.error);
      }
      setState(prev => ({ ...prev, isListening: false }));
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setState(prev => ({ ...prev, isListening: true, transcript: '' }));
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Strip markdown formatting for cleaner speech
    const clean = text
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/[•\-]\s+/g, ', ')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setState(prev => ({ ...prev, isSpeaking: true }));
    utterance.onend = () => setState(prev => ({ ...prev, isSpeaking: false }));
    utterance.onerror = () => setState(prev => ({ ...prev, isSpeaking: false }));

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setState(prev => ({ ...prev, isSpeaking: false }));
  }, []);

  const toggleAutoSpeak = useCallback(() => {
    setState(prev => {
      const next = !prev.autoSpeak;
      savePrefs({ autoSpeak: next });
      if (!next) window.speechSynthesis?.cancel();
      return { ...prev, autoSpeak: next };
    });
  }, []);

  return {
    isListening: state.isListening,
    transcript: state.transcript,
    isSpeaking: state.isSpeaking,
    isSupported: state.isSupported,
    autoSpeak: state.autoSpeak,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggleAutoSpeak,
  };
}
