"use client";

import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Search, User, ShieldAlert, Sparkles, CheckCheck } from "lucide-react";
import { getConversations, getMessages, sendMessage, markAsRead } from "@/app/actions/messages";

export default function AdminMessages() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Localization strings mapping
  const t = {
    title: "Clinical Messages",
    subtitle: "Secure practitioner-to-patient communications",
    searchPlaceholder: "Search conversations...",
    noConversations: "No active conversations",
    selectPlaceholder: "Select a conversation to start consulting",
    systemNote: "Communications are secure and recorded in the audit logs",
    sendButton: "Send Reply",
    inputPlaceholder: "Type your clinical notes or response here..."
  };

  const loadConversations = async (selectFirst = false) => {
    try {
      const res = await getConversations();
      if (res.success && res.conversations) {
        setConversations(res.conversations);
        if (selectFirst && res.conversations.length > 0) {
          setActiveConvId(res.conversations[0].id);
        }
      } else {
        setError(res.error || "Failed to load chats");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    setMessagesLoading(true);
    try {
      const res = await getMessages(convId);
      if (res.success && res.messages) {
        setMessages(res.messages);
        await markAsRead(convId);
        // Refresh conversations list to update unread counts
        const convsRes = await getConversations();
        if (convsRes.success && convsRes.conversations) {
          setConversations(convsRes.conversations);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadConversations(true);
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
      // Setup periodic poll for new messages in active chat
      const interval = setInterval(() => {
        loadMessages(activeConvId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !newMessage.trim()) return;

    const currentMessageText = newMessage;
    setNewMessage("");

    // Optimistic UI update
    const tempId = Math.random().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content: currentMessageText,
        senderId: "me", // Will align with current session on fetch
        senderName: "Doctor",
        createdAt: new Date().toISOString(),
      },
    ]);

    const res = await sendMessage(activeConvId, currentMessageText);
    if (res.success) {
      loadMessages(activeConvId);
    } else {
      setError(res.error || "Failed to send message");
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[var(--primary)] flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-[var(--teal)]" />
            {t.title}
          </h1>
          <p className="text-sm text-[var(--on-surface-variant)] mt-1">{t.subtitle}</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid md:grid-cols-3 gap-6">
        {/* Sidebar - Conversation list */}
        <div className="glass-panel-strong rounded-3xl p-4 border border-[var(--surface-dim)] elevated-shadow flex flex-col">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 w-4 h-4 text-[var(--outline)]" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--surface-lowest)] border border-[var(--surface-dim)] rounded-xl pl-9 pr-4 py-2 text-sm text-[var(--on-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--teal)] transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <span className="loading-dots text-[var(--teal)]" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-10 text-xs text-[var(--outline)]">
                {t.noConversations}
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full text-left p-3.5 rounded-2xl flex items-center gap-3 transition-all border ${
                    activeConvId === conv.id
                      ? "bg-[var(--surface-lowest)] border-[var(--teal)] shadow-sm"
                      : "border-transparent hover:bg-slate-800/40"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--teal)]/15 flex items-center justify-center text-[var(--teal)] shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-sm truncate text-[var(--primary)]">
                        {conv.name}
                      </span>
                      <span className="text-[10px] text-[var(--outline)] shrink-0">
                        {new Date(conv.lastActive).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--on-surface-variant)] truncate mt-1">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-[var(--teal)] text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messaging Area */}
        <div className="md:col-span-2 glass-panel-strong rounded-3xl border border-[var(--surface-dim)] elevated-shadow flex flex-col h-full overflow-hidden">
          {activeConvId && activeConv ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-[var(--surface-dim)] flex justify-between items-center bg-[var(--surface-lowest)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--teal)]/15 flex items-center justify-center text-[var(--teal)]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-[var(--primary)]">{activeConv.name}</h3>
                    <p className="text-[10px] uppercase font-semibold text-[var(--teal)] tracking-wider">
                      {activeConv.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-950/40 px-3 py-1 rounded-full text-[10px] text-[var(--outline)] border border-slate-800">
                  <ShieldAlert className="w-3.5 h-3.5 text-[var(--teal)]" />
                  {t.systemNote}
                </div>
              </div>

              {/* Chat history */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/15">
                {messages.map((msg) => {
                  const isMe = msg.senderId !== activeConv.id; // Sender isn't the patient, so it's clinical staff
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}
                    >
                      {!isMe && (
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-[var(--outline)] mb-1">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isMe
                            ? "bg-[var(--teal)] text-slate-950 rounded-br-none"
                            : "bg-slate-800 text-white rounded-bl-none border border-slate-700"
                        }`}
                      >
                        <p>{msg.content}</p>
                        <div
                          className={`text-[9px] mt-1.5 flex justify-end items-center gap-1 ${
                            isMe ? "text-slate-950/70" : "text-slate-400"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {isMe && <CheckCheck className="w-3 h-3 text-slate-950" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form
                onSubmit={handleSend}
                className="p-4 border-t border-[var(--surface-dim)] bg-[var(--surface-lowest)] flex gap-2 items-center"
              >
                <input
                  type="text"
                  placeholder={t.inputPlaceholder}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--teal)]"
                />
                <button
                  type="submit"
                  className="bg-[var(--teal)] hover:bg-[var(--teal-light)] text-slate-950 p-3 rounded-xl transition-colors shrink-0"
                  aria-label={t.sendButton}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-8 text-[var(--outline)]">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-lowest)] border border-[var(--surface-dim)] flex items-center justify-center mb-4 text-[var(--teal)] shadow-sm">
                <Sparkles className="w-8 h-8" />
              </div>
              <p className="text-sm font-semibold">{t.selectPlaceholder}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
