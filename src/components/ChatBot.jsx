import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  MessageCircle, X, Send, Loader2, Sparkles,
  Plus, Copy, Check, RotateCcw, Trash2, Bot, User,
} from 'lucide-react';
import { chatApi } from '../api/client';
import { useFarm } from '../contexts/FarmContext';
import { useLanguage } from '../contexts/LanguageContext';

/* ───────────────────────── Markdown renderer ───────────────────────── */

/**
 * Safe markdown renderer — no dangerouslySetInnerHTML.
 * Handles headings, bold, italic, inline code, bullets, numbered lists,
 * tables, and blank lines.
 */
function formatMessage(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={i} className="font-bold text-sm mt-2 mb-1">{renderInline(trimmed.slice(4))}</h4>
      );
    } else if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="font-bold text-sm mt-2 mb-1">{renderInline(trimmed.slice(3))}</h3>
      );
    } else if (/^[•\-\*]\s/.test(trimmed)) {
      elements.push(
        <div key={i} className="flex gap-1.5 ml-1 my-0.5">
          <span className="text-brand-500 shrink-0 select-none">•</span>
          <span>{renderInline(trimmed.replace(/^[•\-\*]\s/, ''))}</span>
        </div>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = trimmed.match(/^(\d+)\.\s/)[1];
      elements.push(
        <div key={i} className="flex gap-1.5 ml-1 my-0.5">
          <span className="text-brand-500 shrink-0 select-none font-medium text-xs min-w-[1.2em] text-right">{num}.</span>
          <span>{renderInline(trimmed.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
    } else if (/^\|/.test(trimmed)) {
      if (!/^[\|\-\s:]+$/.test(trimmed)) {
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
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Try code first, then bold, then italic
    const codeMatch = remaining.match(/`([^`]+)`/);
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/);

    // Find earliest match
    const matches = [
      codeMatch && { m: codeMatch, type: 'code' },
      boldMatch && { m: boldMatch, type: 'bold' },
      italicMatch && { m: italicMatch, type: 'italic' },
    ].filter(Boolean).sort((a, b) => a.m.index - b.m.index);

    const match = matches[0];

    if (!match) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    if (match.m.index > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, match.m.index)}</span>);
    }

    if (match.type === 'code') {
      parts.push(
        <code key={key++} className="bg-gray-200 dark:bg-gray-600 px-1 py-0.5 rounded text-xs font-mono">
          {match.m[1]}
        </code>
      );
    } else if (match.type === 'bold') {
      parts.push(<strong key={key++} className="font-semibold">{match.m[1]}</strong>);
    } else {
      parts.push(<em key={key++}>{match.m[1]}</em>);
    }

    remaining = remaining.slice(match.m.index + match.m[0].length);
  }

  return parts;
}

/* ───────────────────────── ChatBot Component ───────────────────────── */

const WELCOME_SUGGESTIONS_EN = ['Tell me about rice', 'What is crop rotation?', 'Best soil for groundnut'];
const WELCOME_SUGGESTIONS_MM = ['ဆန်စပါးအကြောင်းပြောပြပါ', 'သီးနှံအလှည့်ကျဆိုတာဘာလဲ', 'မြေပဲအတွက်အကောင်းဆုံးမြေ'];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvIndex, setActiveConvIndex] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const { currentFarm, backendAvailable } = useFarm();
  const { lang, t } = useLanguage();

  // Build welcome message based on language
  const makeWelcomeMessage = useCallback(() => ({
    role: 'bot',
    text: t('chatWelcome'),
    suggestions: lang === 'mm' ? WELCOME_SUGGESTIONS_MM : WELCOME_SUGGESTIONS_EN,
  }), [lang, t]);

  // Initialize first conversation
  useEffect(() => {
    setConversations([{ messages: [makeWelcomeMessage()], history: [] }]);
  }, [makeWelcomeMessage]);

  const activeConv = conversations[activeConvIndex] || { messages: [], history: [] };
  const messages = activeConv.messages;

  // Check AI status once when chat opens
  useEffect(() => {
    if (isOpen && backendAvailable && aiStatus === null) {
      chatApi.status().then(setAiStatus).catch(() => setAiStatus({ ai_enabled: false }));
    }
  }, [isOpen, backendAvailable, aiStatus]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Auto-resize textarea
  const handleTextareaInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // Update a conversation immutably
  const updateConv = useCallback((index, updater) => {
    setConversations(prev => prev.map((c, i) => i === index ? updater(c) : c));
  }, []);

  // ── Send message ──
  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const convIdx = activeConvIndex;
    const userMsg = { role: 'user', text: trimmed };

    // Add user message and build history
    updateConv(convIdx, c => ({
      ...c,
      messages: [...c.messages, userMsg],
      history: [...c.history, { role: 'user', content: trimmed }],
    }));

    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const context = currentFarm ? {
        farm_name: currentFarm.name,
        current_crop: currentFarm.current_crop,
        soil_type: currentFarm.soil_type,
        region: currentFarm.region,
      } : null;

      if (backendAvailable) {
        // Get current history for the API call
        const currentHistory = conversations[convIdx]?.history || [];
        const historyForApi = [...currentHistory, { role: 'user', content: trimmed }];

        const res = await chatApi.send(trimmed, {
          context,
          history: historyForApi.slice(-20),
          language: lang,
          farm_id: currentFarm?.id || null,
        });

        const botMsg = {
          role: 'bot',
          text: res.response,
          suggestions: res.suggestions,
          ai_used: res.ai_used,
          mode: res.mode,
        };

        updateConv(convIdx, c => ({
          ...c,
          messages: [...c.messages, botMsg],
          history: [...c.history, { role: 'assistant', content: res.response }],
        }));
      } else {
        const offlineMsg = {
          role: 'bot',
          text: t('chatNoBackend'),
          suggestions: [],
          mode: 'offline',
        };
        updateConv(convIdx, c => ({
          ...c,
          messages: [...c.messages, offlineMsg],
        }));
      }
    } catch {
      const errorMsg = {
        role: 'bot',
        text: t('chatError'),
        suggestions: lang === 'mm' ? ['မင်္ဂလာပါ', 'ဆန်စပါးအကြောင်းပြောပါ'] : ['Hello', 'Tell me about rice'],
        mode: 'error',
      };
      updateConv(convIdx, c => ({
        ...c,
        messages: [...c.messages, errorMsg],
      }));
    } finally {
      setLoading(false);
    }
  }, [input, loading, currentFarm, backendAvailable, activeConvIndex, conversations, lang, t, updateConv]);

  // ── New chat ──
  const startNewChat = useCallback(() => {
    const newConv = { messages: [makeWelcomeMessage()], history: [] };
    setConversations(prev => [...prev, newConv]);
    setActiveConvIndex(conversations.length);
    setInput('');
    setLoading(false);
  }, [makeWelcomeMessage, conversations.length]);

  // ── Clear chat ──
  const clearChat = useCallback(() => {
    updateConv(activeConvIndex, () => ({
      messages: [makeWelcomeMessage()],
      history: [],
    }));
    setInput('');
    setLoading(false);
  }, [activeConvIndex, makeWelcomeMessage, updateConv]);

  // ── Copy message ──
  const copyMessage = useCallback((text, idx) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }).catch(() => {});
  }, []);

  // ── Retry last message ──
  const retryLast = useCallback(() => {
    // Find the last user message
    const msgs = conversations[activeConvIndex]?.messages || [];
    let lastUserMsg = null;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') { lastUserMsg = msgs[i].text; break; }
    }
    if (!lastUserMsg) return;

    // Remove the last bot message(s) after the last user message
    updateConv(activeConvIndex, c => {
      const newMsgs = [...c.messages];
      while (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'bot') {
        newMsgs.pop();
      }
      // Also remove the last user message — sendMessage will re-add it
      if (newMsgs.length > 0 && newMsgs[newMsgs.length - 1].role === 'user') {
        newMsgs.pop();
      }
      const newHistory = c.history.slice(0, -2); // remove last user + assistant
      return { ...c, messages: newMsgs, history: newHistory };
    });

    setTimeout(() => sendMessage(lastUserMsg), 100);
  }, [activeConvIndex, conversations, updateConv, sendMessage]);

  // ── Keyboard handling ──
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Mode badge ──
  const modeBadge = useMemo(() => {
    if (!aiStatus) return null;
    return aiStatus.ai_enabled
      ? { label: t('chatAiPowered'), color: 'bg-emerald-500' }
      : { label: t('chatKnowledgeBase'), color: 'bg-amber-500' };
  }, [aiStatus, t]);

  if (conversations.length === 0) return null;

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-14 h-14 bg-forest hover:bg-forest/90 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-forest/50"
          style={{ zIndex: 9999 }}
          aria-label="Open farming assistant"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white dark:border-gray-900" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          className="fixed bottom-0 right-0 sm:bottom-8 sm:right-8 w-full sm:w-[400px] sm:max-w-[calc(100vw-2rem)] h-[100dvh] sm:h-[560px] sm:max-h-[calc(100vh-6rem)] bg-white dark:bg-gray-800 sm:rounded-2xl shadow-2xl border-0 sm:border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in"
          style={{ zIndex: 9999 }}
        >
          {/* ── Header ── */}
          <div className="bg-forest px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold text-sm">{t('chatTitle')}</h3>
                  {modeBadge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium ${modeBadge.color}`}>
                      {modeBadge.label}
                    </span>
                  )}
                </div>
                <p className="text-white/70 text-[10px]">
                  {backendAvailable ? t('chatOnline') : t('chatOffline')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* New Chat */}
              <button
                onClick={startNewChat}
                className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                aria-label={t('chatNewChat')}
                title={t('chatNewChat')}
              >
                <Plus className="w-4 h-4" />
              </button>
              {/* Clear Chat */}
              <button
                onClick={clearChat}
                className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                aria-label="Clear chat"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {/* Close */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Messages area ── */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
            {messages.map((msg, i) => (
              <div key={i} className="group">
                {/* Message bubble */}
                <div className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === 'user'
                      ? 'bg-forest/10 dark:bg-forest/20'
                      : 'bg-amber-50 dark:bg-amber-900/20'
                  }`}>
                    {msg.role === 'user'
                      ? <User className="w-3.5 h-3.5 text-forest dark:text-brand-400" />
                      : <Bot className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    }
                  </div>

                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed inline-block text-left ${
                        msg.role === 'user'
                          ? 'bg-forest text-white rounded-tr-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-tl-md'
                      }`}
                    >
                      {msg.role === 'bot' ? formatMessage(msg.text) : msg.text}
                    </div>

                    {/* Bot message actions */}
                    {msg.role === 'bot' && i > 0 && (
                      <div className="flex items-center gap-1 mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => copyMessage(msg.text, i)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded"
                          title={t('chatCopy')}
                        >
                          {copiedIdx === i
                            ? <Check className="w-3 h-3 text-green-500" />
                            : <Copy className="w-3 h-3" />
                          }
                        </button>
                        {i === messages.length - 1 && !loading && (
                          <button
                            onClick={retryLast}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded"
                            title={t('chatRetry')}
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                        {/* Mode indicator */}
                        {msg.mode && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ml-1 ${
                            msg.mode === 'ai' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {msg.mode === 'ai' ? 'AI' : 'KB'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Suggestion chips — only for the latest bot message */}
                {msg.role === 'bot' && msg.suggestions?.length > 0 && i === messages.length - 1 && !loading && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-10">
                    {msg.suggestions.map((s, j) => (
                      <button
                        key={j}
                        onClick={() => sendMessage(s)}
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

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs">{t('chatThinking')}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Input area ── */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2.5 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder={t('chatPlaceholder')}
                disabled={loading}
                rows={1}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-xl px-3.5 py-2.5 placeholder-gray-400 outline-none focus:ring-2 focus:ring-forest/30 dark:focus:ring-brand-500/30 disabled:opacity-60 resize-none min-h-[40px] max-h-[120px]"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-forest hover:bg-forest/90 text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-0.5"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] text-gray-400 mt-1.5 text-center">
              {t('chatFooter')} — {currentFarm?.name || 'No farm selected'}
            </p>
          </div>
        </div>
      )}

      {/* Inline animation + scrollbar styles */}
      <style>{`
        .animate-in {
          animation: chatSlideIn 0.25s ease-out;
        }
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 4px; }
      `}</style>
    </>
  );
}
