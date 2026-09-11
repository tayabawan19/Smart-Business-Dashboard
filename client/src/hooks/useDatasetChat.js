import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

/**
 * Custom hook for Dataset Q&A Chat (Phase 7)
 */
export const useDatasetChat = (datasetId) => {
  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(Boolean(datasetId));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);

  // Load chat history when datasetId changes
  const loadHistory = useCallback(async () => {
    if (!datasetId) {
      setMessages([]);
      setLoadingHistory(false);
      return;
    }

    try {
      setLoadingHistory(true);
      setError(null);
      const res = await api.getChatHistory(datasetId);
      if (res && Array.isArray(res.messages)) {
        setMessages(res.messages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.warn(`[useDatasetChat] Failed to load chat history:`, err.message);
      // Non-fatal, just start with empty history
      setMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [datasetId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Send a new question
  const sendMessage = useCallback(
    async (questionText) => {
      const q = questionText?.trim();
      if (!q || !datasetId || sending) return;

      const tempUserMsg = {
        _id: `temp-${Date.now()}`,
        role: 'user',
        content: q,
        createdAt: new Date().toISOString(),
      };

      // Optimistically append user message
      setMessages((prev) => [...prev, tempUserMsg]);
      setSending(true);
      setError(null);

      // Extract last 6 messages for bounded context
      const conversationHistory = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const res = await api.sendChatMessage(datasetId, q, conversationHistory);
        if (res && res.success) {
          const assistantMsg = {
            _id: `resp-${Date.now()}`,
            role: 'assistant',
            content: res.answer,
            provider: res.provider,
            mode: res.mode,
            queryContext: res.queryContext,
            createdAt: res.timestamp || new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setRateLimited(false);
        } else {
          throw new Error(res.message || 'Failed to receive answer.');
        }
      } catch (err) {
        console.error(`[useDatasetChat] Chat error:`, err);
        const errMsg = err.message || 'Error communicating with chat service.';
        setError(errMsg);

        const is429 = errMsg.toLowerCase().includes('limit') || errMsg.includes('429');
        if (is429) {
          setRateLimited(true);
          toast.error("You've reached your chat limit (20 questions/hour).");
        } else {
          toast.error(errMsg);
        }

        // Add error assistant response to the conversation so the user sees it in-line
        const errAssistantMsg = {
          _id: `err-${Date.now()}`,
          role: 'assistant',
          content: is429
            ? "⚠️ **Rate limit reached**: You've reached your hourly limit of 20 questions. Please wait before asking more questions."
            : `⚠️ **Unable to process**: ${errMsg}`,
          isError: true,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errAssistantMsg]);
      } finally {
        setSending(false);
      }
    },
    [datasetId, messages, sending]
  );

  // Clear chat history
  const clearHistory = useCallback(async () => {
    if (!datasetId) return;

    try {
      await api.clearChatHistory(datasetId);
      setMessages([]);
      toast.success('Chat history cleared.');
    } catch (err) {
      toast.error('Failed to clear chat history.');
    }
  }, [datasetId]);

  return {
    messages,
    loadingHistory,
    sending,
    error,
    rateLimited,
    sendMessage,
    clearHistory,
    reloadHistory: loadHistory,
  };
};
