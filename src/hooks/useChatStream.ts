"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
}

interface UseChatStreamOptions {
  chatId?: string;
  projectId?: string;
  projectContext?: Record<string, unknown>;
  onChatIdChange?: (chatId: string) => void;
  onError?: (err: Error) => void;
}

function getApiMessages(msgs: Message[]): Message[] {
  return msgs.filter(
    (m) =>
      (m.role === "user" || m.role === "assistant") &&
      m.content.trim().length > 0
  );
}

function normalizeLoadedMessages(raw: unknown[]): Message[] {
  return raw
    .map((m: any) => ({
      role: (m.role || (m.sender === "user" ? "user" : "assistant")) as Message["role"],
      content: m.content || m.message || m.text || "",
      timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
    }))
    .filter((m) => m.content.trim().length > 0);
}

export function useChatStream(options?: UseChatStreamOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(options?.chatId);

  const activeChatIdRef = useRef(activeChatId);
  const projectContextRef = useRef(options?.projectContext);
  const messagesRef = useRef(messages);
  const isLoadingRef = useRef(isLoading);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    projectContextRef.current = options?.projectContext;
  }, [options?.projectContext]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  useEffect(() => {
    if (options?.chatId) {
      setActiveChatId(options.chatId);
    }
  }, [options?.chatId]);

  const loadChatHistory = useCallback(async (chatId: string) => {
    const res = await fetch(`/api/conversations/${chatId}`);
    if (!res.ok) return;

    const data = await res.json();
    const rawArray = Array.isArray(data)
      ? data
      : data.messages || data.history || [];

    if (Array.isArray(rawArray) && rawArray.length > 0) {
      setMessages(normalizeLoadedMessages(rawArray));
    }
  }, []);

  // Load existing project-linked chat on mount
  useEffect(() => {
    if (!options?.projectId || options?.chatId) return;

    let cancelled = false;

    async function bootstrapProjectChat() {
      setIsBootstrapping(true);
      try {
        const res = await fetch(`/api/conversations?projectId=${options!.projectId}`);
        if (!res.ok || cancelled) return;

        const sessions = await res.json();
        const existing = Array.isArray(sessions) ? sessions[0] : null;
        const existingId = existing?.id || existing?._id;

        if (existingId && !cancelled) {
          setActiveChatId(existingId);
          activeChatIdRef.current = existingId;
          options?.onChatIdChange?.(existingId);
          await loadChatHistory(existingId);
        }
      } catch (err) {
        console.error("[PROJECT_CHAT_BOOTSTRAP_ERROR]:", err);
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    bootstrapProjectChat();
    return () => {
      cancelled = true;
    };
  }, [options?.projectId, options?.chatId, loadChatHistory, options?.onChatIdChange]);

  // Load history when chatId is provided directly
  useEffect(() => {
    if (!options?.chatId) return;
    loadChatHistory(options.chatId);
  }, [options?.chatId, loadChatHistory]);

  const ensureChatSession = useCallback(
    async (title: string): Promise<string | undefined> => {
      if (activeChatIdRef.current) return activeChatIdRef.current;

      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.slice(0, 35),
          projectId: options?.projectId,
        }),
      });

      if (!res.ok) return undefined;

      const data = await res.json();
      const newId = data.id || data._id || data.sessionId;
      if (!newId) return undefined;

      setActiveChatId(newId);
      activeChatIdRef.current = newId;
      options?.onChatIdChange?.(newId);
      return newId;
    },
    [options?.projectId, options?.onChatIdChange]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoadingRef.current) return;

      const userMsg: Message = { role: "user", content, timestamp: new Date() };
      const updatedMessages = [...messagesRef.current, userMsg];

      setMessages(updatedMessages);
      setIsLoading(true);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", timestamp: new Date() },
      ]);

      try {
        const chatId = await ensureChatSession(content);
        if (!chatId) {
          throw new Error("Chat session create nahi ho saki");
        }

        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: getApiMessages(updatedMessages),
            chatId,
            projectContext: projectContextRef.current,
          }),
        });

        if (!response.ok || !response.body) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Stream Error: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;

          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              ...next[next.length - 1],
              content: accumulatedText,
            };
            return next;
          });
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to stream chat");
        console.error("[CHAT_STREAM_ERROR]:", error);
        options?.onError?.(error);

        setMessages((prev) =>
          prev.filter((m) => m.content.trim() !== "" || m.role !== "assistant")
        );
      } finally {
        setIsLoading(false);
      }
    },
    [ensureChatSession, options]
  );

  return {
    messages,
    sendMessage,
    isLoading,
    isBootstrapping,
    activeChatId,
    setMessages,
  };
}
