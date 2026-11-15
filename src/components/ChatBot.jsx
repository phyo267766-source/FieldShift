import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { chatApi } from '../api/client';
import { useFarm } from '../contexts/FarmContext';

/**
 * Simple markdown-like renderer for chat messages.
 * Handles **bold**, ### headings, bullet points, and newlines.
 */
function formatMessage(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="font-bold text-sm text-gray-900 dark:text-gray-100 mt-2 mb-1">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="font-bold text-sm text-gray-900 dark:text-gray-100 mt-2 mb-1">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
    } else if (/^[•\-\*]\s/.test(trimmed)) {
      elements.push(
        <div key={i} className="flex gap-1.5 ml-1 my-0.5">
          <span className="text-brand-500 shrink-0">•</span>
          <span>{renderInline(trimmed.replace(/^[•\-\*]\s/, ''))}</span>
        </div>
      );
    } else if (/^\|/.test(trimmed)) {
      // Table row — render as simple text
      if (!/^[\|\-\s]+$/.test(trimmed)) {
        const cells = trimmed.split('|').filter(c => c.trim());
        elements.push(
          <div key={i} className="flex gap-2 text-xs py-0.5 border-b border-gray-100 dark:border-gray-700">
            {cells.map((cell, j) => (
              <span key={j} className={`flex-1 ${j === 0 ? 'font-medium' : ''}`}>
                {renderInline(cell.trim())}
              </span>
            ))}
          </div>
        );
      }
    } else if (trimmed === '') {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<p key={i} className="my-0.5">{renderInline(trimmed)}</p>);
    }
  });

  return elements;
}

function renderInline(text) {
  // Bold **text** and *italic*
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/\*(.+?)\*/);

    const match = boldMatch && italicMatch
      ? (boldMatch.index <= italicMatch.index ? boldMatch : italicMatch)
      : boldMatch || italicMatch;

    if (!match) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (match.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, match.index)}</span>);
    }

    if (match[0].startsWith('**')) {
      parts.push(<strong key={key++} className="font-semibold text-gray-900 dark:text-gray-100">{match[1]}</strong>);
    } else {
      parts.push(<em key={key++}>{match[1]}</em>);
    }

    remaining = remaining.slice(match.index + match[0].length);
  }

  return parts;
}


export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "Mingalaba! 🙏 I'm FieldShift's farming assistant. Ask me about crops, soil, pests, weather, or rotation advice for Myanmar!",
      suggestions: ['Tell me about rice', 'What is crop rotation?', 'Best soil for groundnut'],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { currentFarm, backendAvailable } = useFarm();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    try {
      // Build context from current farm
      const context = currentFarm ? {
        farm_name: currentFarm.name,
        current_crop: currentFarm.current_crop,
        soil_type: currentFarm.soil_type,
        region: currentFarm.region,
      } : null;

      if (backendAvailable) {
        const res = await chatApi.send(trimmed, context);
        setMessages(prev => [...prev, {
          role: 'bot',
          text: res.response,
          suggestions: res.suggestions,
        }]);
      } else {
        // Offline fallback — basic responses
        setMessages(prev => [...prev, {
          role: 'bot',
          text: "I need the backend server to answer your questions. Please make sure the Flask server is running (`python app.py` in the backend folder), then try again!",
          suggestions: ['How to start the server?'],
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "Sorry, I couldn't process your question. Please make sure the backend server is running and try again.",
        suggestions: ['Hello', 'Tell me about rice'],
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, currentFarm, backendAvailable]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-forest hover:bg-forest/90 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          style={{ zIndex: 9999 }}
          aria-label="Open farming assistant"
        >
          <MessageCircle className="w-6 h-6" />
          {/* Notification dot */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white dark:border-gray-900" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-8 right-8 w-[380px] max-w-[calc(100vw-2rem)] h-[540px] max-h-[calc(100vh-6rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in" style={{ zIndex: 9999 }}>
          {/* Header */}
          <div className="bg-forest px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Farm Assistant</h3>
                <p className="text-white/70 text-[10px]">
                  {backendAvailable ? 'Online — Ask me anything!' : 'Offline — Start the backend'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors p-1"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin">
            {messages.map((msg, i) => (
              <div key={i}>
                {/* Message bubble */}
                <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-forest text-white rounded-br-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-bl-md'
                    }`}
                  >
                    {msg.role === 'bot' ? formatMessage(msg.text) : msg.text}
                  </div>
                </div>

                {/* Suggestion chips */}
                {msg.role === 'bot' && msg.suggestions && i === messages.length - 1 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                    {msg.suggestions.map((s, j) => (
                      <button
                        key={j}
                        onClick={() => handleSuggestionClick(s)}
                        disabled={loading}
                        className="text-[11px] px-2.5 py-1 rounded-full border border-forest/30 text-forest dark:text-brand-400 dark:border-brand-500/30 hover:bg-forest/5 dark:hover:bg-brand-500/10 transition-colors disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about crops, soil, pests..."
                disabled={loading}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-xl px-3.5 py-2.5 placeholder-gray-400 outline-none focus:ring-2 focus:ring-forest/30 dark:focus:ring-brand-500/30 disabled:opacity-60"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-forest hover:bg-forest/90 text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] text-gray-400 mt-1.5 text-center">
              FieldShift Farming Assistant — Rule-based agricultural advice for Myanmar
            </p>
          </div>
        </div>
      )}

      {/* Inline styles for animation */}
      <style>{`
        .animate-in {
          animation: chatSlideIn 0.25s ease-out;
        }
        @keyframes chatSlideIn {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.15);
          border-radius: 4px;
        }
      `}</style>
    </>
  );
}
