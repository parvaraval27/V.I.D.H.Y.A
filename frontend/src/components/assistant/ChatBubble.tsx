import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, X, Send, RotateCw, Sparkles } from 'lucide-react';
import { useAssistant } from '@/hooks/useAssistant';

export default function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    sending,
    suggestions,
    sendMessage,
    loadHistory,
    loadSuggestions,
    resetConversation,
  } = useAssistant();

  // Useeffect to load the history and suggestions when the panel is opened
  useEffect(() => {
    if (open) {
      loadHistory();
      loadSuggestions();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, loadHistory, loadSuggestions]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleSend = useCallback(() => {
    if (!input.trim() || sending) return;
    sendMessage(input);
    setInput('');
  }, [input, sending, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    sendMessage(text);
  };

  const handleReset = () => {
    resetConversation(true);
  };

  // Close on escapeand open on custom event
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const openHandler = () => setOpen(true);
    window.addEventListener('keydown', handler);
    window.addEventListener('open-assistant', openHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('open-assistant', openHandler);
    };
  }, []);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label="AI Assistant Button"
        >
          <Bot className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-purple-600 text-white rounded-t-2xl shrink-0">
            <Bot className="w-5 h-5" />
            <span className="font-semibold text-sm flex-1">V.I.D.H.Y.A. A.I.</span>
            <button
              onClick={handleReset}
              className="p-1 hover:bg-purple-500 rounded transition-colors"
              title="New conversation"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-purple-500 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && !sending && (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8 space-y-4">
                <Sparkles className="w-10 h-10 mx-auto text-purple-400 opacity-60" />
                <p className="text-sm font-medium">What can I help you with?</p>

                {/* Suggestion chips */}
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-700 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: msg.role === 'assistant' ? formatMarkdown(msg.text) : escapeHtml(msg.text),
                  }}
                />
              </div>
            ))}

            {/* Typing indicator */}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-2 flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command..."
                disabled={sending}
                className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-40 disabled:hover:bg-purple-600 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Minimal markdown to HTML (bold, bullet lists, newlines) */
function formatMarkdown(text: string): string {
  let html = escapeHtml(text);
  // Bold: **text**
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Bullet lines: lines starting with • or -
  html = html.replace(/^[•\-]\s+(.*)$/gm, '<span class="block ml-2">• $1</span>');
  // Newlines
  html = html.replace(/\n/g, '<br/>');
  return html;
}
