import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Trash2,
  Sparkles,
  Bot,
  User,
  AlertCircle,
  HelpCircle,
  Clock,
  Database,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { useDatasetChat } from '../../hooks/useDatasetChat';

/**
 * Lightweight helper to format basic markdown (bold, bullet points, line breaks)
 */
const FormattedMessage = ({ content }) => {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Handle bullet points
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
        const cleanLine = isBullet ? trimmed.slice(2) : line;

        // Parse bold segments **text**
        const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-semibold text-slate-100">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-brand-400 font-bold mt-0.5">•</span>
              <span>{rendered}</span>
            </div>
          );
        }

        return <p key={idx}>{rendered}</p>;
      })}
    </div>
  );
};

const SUGGESTED_PROMPTS = [
  { text: 'What were our total sales & averages?', icon: TrendingUp },
  { text: 'Who is our top performing category?', icon: Award },
  { text: 'What is the projected forecast for the next period?', icon: Sparkles },
  { text: 'Were there any unusual outliers or spikes in the data?', icon: AlertCircle },
  { text: 'Which columns and fields are tracked in this dataset?', icon: Database },
];

export const ChatDrawer = ({ isOpen, onClose, datasetId, datasetName = 'Business Dataset' }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    messages,
    loadingHistory,
    sending,
    error,
    rateLimited,
    sendMessage,
    clearHistory,
  } = useDatasetChat(datasetId);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Auto focus input on open
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen, messages, sending]);

  // Handle send message
  const handleSend = async (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || sending || !datasetId) return;

    setInputText('');
    await sendMessage(text);
  };

  // Handle keypress (Enter to send, Shift+Enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-fade-in"
        onClick={onClose}
        aria-label="Close Chat"
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] md:w-[520px] bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700/80 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-slide-left">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">Chat With Data</h3>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30 rounded-full">
                  Phase 7
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[240px] sm:max-w-[280px]" title={datasetName}>
                {datasetName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearHistory}
                disabled={sending}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors"
                title="Clear chat history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Rate Limit & Grounding Notice Banner */}
        <div className="px-4 py-2 bg-slate-800/40 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-brand-400" />
            <span>Anti-hallucination grounded Q&A</span>
          </div>
          <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded border border-slate-600/40">
            20 questions / hour
          </span>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading conversation history...</p>
            </div>
          ) : messages.length === 0 ? (
            /* Empty State */
            <div className="py-6 px-2 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 mx-auto flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200">Ask anything about your data</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Get instant, accurate numbers, category summaries, and trend forecasts without guessing or hallucinations.
                </p>
              </div>

              {/* Suggestion Chips */}
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 pl-1">
                  Suggested Questions
                </p>
                <div className="space-y-1.5">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => {
                    const Icon = prompt.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendMessage(prompt.text)}
                        className="w-full text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-brand-950/40 border border-slate-700/60 hover:border-brand-500/40 text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-brand-400 group-hover:text-brand-300 flex-shrink-0" />
                          <span>{prompt.text}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-400 transform group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Messages List */
            messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg._id || index}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                      isUser
                        ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-sm'
                        : msg.isError
                        ? 'bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-tl-sm'
                        : 'bg-slate-800/90 border border-slate-700/70 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    <FormattedMessage content={msg.content} />

                    {/* Metadata footer for assistant */}
                    {!isUser && !msg.isError && (
                      <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Grounded data answer</span>
                        </span>
                        {msg.queryContext && (
                          <span className="px-1.5 py-0.5 bg-slate-700/50 text-brand-300 rounded text-[9px]">
                            lookup query executed
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {sending && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 text-brand-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-800/90 border border-slate-700/70 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                <span className="text-xs text-slate-400">Consulting dataset...</span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Rate Limit Alert */}
        {rateLimited && (
          <div className="mx-4 mb-2 p-2.5 bg-rose-950/60 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>You have reached the 20 messages/hour limit. Please wait a bit before asking again.</span>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending || rateLimited || !datasetId}
              placeholder={
                rateLimited
                  ? 'Rate limit reached. Please wait...'
                  : 'Ask about sales, top categories, forecast...'
              }
              className="w-full pl-4 pr-12 py-3 bg-slate-800/80 border border-slate-700/80 focus:border-brand-500 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending || rateLimited || !datasetId}
              className="absolute right-2 p-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-40 text-white rounded-lg transition-all shadow-md flex items-center justify-center"
              title="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="mt-2 text-[10px] text-slate-400 text-center">
            Grounded by statistical summaries & Python microservice query verification.
          </p>
        </div>
      </div>
    </>
  );
};
