import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { assistantAPI, Message, AssistantResponse } from '@/lib/assistantApi';

export function useAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const navigate = useNavigate();
  const loadedRef = useRef(false);

  const loadHistory = useCallback(async () => {
    if (loadedRef.current) return;
    try {
      const msgs = await assistantAPI.getHistory();
      setMessages(msgs);
      loadedRef.current = true;
    } catch {
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      const s = await assistantAPI.getSuggestions();
      setSuggestions(s);
    } catch {
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg: Message = { role: 'user', text: trimmed, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
      const res: AssistantResponse = await assistantAPI.sendMessage(trimmed);

      // Add assistant response
      const assistantMsg: Message = {
        role: 'assistant',
        text: res.message,
        timestamp: new Date().toISOString(),
        metadata: {
          intent: res.intent,
          score: res.confidence,
          action: res.action,
        },
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Handle navigation
      if (res.action?.type === 'navigate' && res.action.path) {
        setTimeout(() => navigate(res.action!.path!), 500);
      }
    } catch (err: any) {
      const errMsg: Message = {
        role: 'assistant',
        text: err?.response?.data?.message || 'Something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }, [navigate]);

  const resetConversation = useCallback(async (newSession = false) => {
    try {
      await assistantAPI.resetConversation(newSession);
      if (newSession) {
        setMessages([]);
        loadedRef.current = false;
      }
    } catch {
    }
  }, []);

  return {
    messages,
    sending,
    suggestions,
    sendMessage,
    loadHistory,
    loadSuggestions,
    resetConversation,
  };
}
