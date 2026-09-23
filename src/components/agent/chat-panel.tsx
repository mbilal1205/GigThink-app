"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import ProposalView from "./proposal-view";
import ConfirmationModal from "./confirmation-modal";
import {
  Plus,
  Pin,
  PinOff,
  Trash2,
  MessageSquare,
  Loader2,
  Send,
  Sparkles,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "text" | "proposal";
  structuredData?: any;
  pendingAction?: any;
}

interface Session {
  sessionId: string;
  sessionTitle?: string;
  isPinned: boolean;
  updatedAt: string;
}

const markdownComponents = {
  h1: (props: any) => <h1 className="text-xl font-bold text-foreground mt-4 mb-2" {...props} />,
  h2: (props: any) => <h2 className="text-lg font-semibold text-foreground mt-3 mb-1" {...props} />,
  h3: (props: any) => <h3 className="text-base font-medium text-foreground mt-2 mb-1" {...props} />,
  p: (props: any) => <p className="text-sm text-foreground/90 leading-relaxed mb-2" {...props} />,
  ul: (props: any) => <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1 mb-2" {...props} />,
  ol: (props: any) => <ol className="list-decimal pl-5 text-sm text-foreground/90 space-y-1 mb-2" {...props} />,
  li: (props: any) => <li className="mb-1" {...props} />,
  strong: (props: any) => <strong className="font-semibold text-primary" {...props} />,
  em: (props: any) => <em className="italic text-muted-foreground" {...props} />,
  code: (props: any) => <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props} />,
  pre: (props: any) => <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs font-mono" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground" {...props} />,
  a: (props: any) => <a className="text-primary underline hover:opacity-80" target="_blank" rel="noopener noreferrer" {...props} />,
  hr: (props: any) => <hr className="border-border my-3" {...props} />,
  table: (props: any) => <table className="w-full text-sm border-collapse my-2" {...props} />,
  th: (props: any) => <th className="border border-border px-2 py-1 text-left font-medium bg-muted" {...props} />,
  td: (props: any) => <td className="border border-border px-2 py-1" {...props} />,
};

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("default");
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/agent/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions);
      }
    } catch (e) {}
  };

  const loadSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    try {
      const res = await fetch(`/api/agent/sessions/messages?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      } else {
        setMessages([]);
      }
    } catch (e) {
      setMessages([]);
    }
  };

  const startNewChat = () => {
    const newSessionId = `session_${Date.now()}`;
    setCurrentSessionId(newSessionId);
    setMessages([]);
    fetchSessions();
  };

  const deleteSessionHandler = async (sessionId: string) => {
    await fetch("/api/agent/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (sessionId === currentSessionId) {
      startNewChat();
    }
    fetchSessions();
  };

  const togglePinHandler = async (sessionId: string, isPinned: boolean) => {
    await fetch("/api/agent/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, isPinned }),
    });
    fetchSessions();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content, sessionId: currentSessionId }),
      });

      if (!response.ok) throw new Error("Failed to get response");
      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        type: data.type || "text",
        structuredData: data.structuredData || null,
        pendingAction: data.pendingAction || null,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      fetchSessions();

      if (data.pendingAction) {
        setPendingAction(data.pendingAction);
        setIsConfirmOpen(true);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "âš ï¸ Something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setConfirmLoading(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          pendingActionId: pendingAction.id,
          approved: true,
        }),
      });
      const data = await res.json();
      const resultMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, resultMessage]);
      setIsConfirmOpen(false);
      setPendingAction(null);
      fetchSessions();
    } catch (error) {
      console.error(error);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleReject = async () => {
    setConfirmLoading(true);
    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSessionId,
          pendingActionId: pendingAction.id,
          approved: false,
        }),
      });
      const data = await res.json();
      const resultMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, resultMessage]);
      setIsConfirmOpen(false);
      setPendingAction(null);
      fetchSessions();
    } catch (error) {
      console.error(error);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border flex flex-col bg-card/50">
        <div className="p-3">
          <Button onClick={startNewChat} className="w-full btn-gradient text-white gap-2">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 p-2">
          {sessions.filter(s => s.isPinned).map(session => (
            <SessionItem
              key={session.sessionId}
              session={session}
              active={session.sessionId === currentSessionId}
              onSelect={() => loadSession(session.sessionId)}
              onDelete={() => deleteSessionHandler(session.sessionId)}
              onTogglePin={() => togglePinHandler(session.sessionId, !session.isPinned)}
            />
          ))}
          {sessions.filter(s => !s.isPinned).map(session => (
            <SessionItem
              key={session.sessionId}
              session={session}
              active={session.sessionId === currentSessionId}
              onSelect={() => loadSession(session.sessionId)}
              onDelete={() => deleteSessionHandler(session.sessionId)}
              onTogglePin={() => togglePinHandler(session.sessionId, !session.isPinned)}
            />
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground mt-20">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-heading text-foreground mb-2">
                GigThink AI Agent
              </h2>
              <p className="text-sm">
                Ask me anything about leads, proposals, clients, or your business.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 shadow-sm", msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card border border-border rounded-bl-none")}>
                {msg.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : msg.type === "proposal" && msg.structuredData ? (
                  <ProposalView data={msg.structuredData} />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
                <span className={cn("text-[10px] block mt-2", msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {msg.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-border p-4 bg-background/80 backdrop-blur">
          <form onSubmit={sendMessage} className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary"
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="btn-gradient text-white font-medium gap-2">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isLoading ? "Sending..." : "Send"}
            </Button>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        actionType={pendingAction?.actionType || ""}
        onApprove={handleApprove}
        onReject={handleReject}
        isLoading={confirmLoading}
      />
    </div>
  );
}

function SessionItem({ session, active, onSelect, onDelete, onTogglePin }: any) {
  return (
    <div className={cn(
      "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors",
      active ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
    )}>
      <div onClick={onSelect} className="flex-1 truncate flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate">{session.sessionTitle || session.sessionId.slice(0, 20)}</span>
      </div>
      <button onClick={onTogglePin} className="opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity">
        {session.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
      </button>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}