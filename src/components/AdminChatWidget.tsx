import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, User, ShieldCheck, AlertCircle, RefreshCw } from "lucide-react";
import { UserProfile } from "../types";
import { fetchChatMessages, sendChatMessage, ChatMessage } from "../lib/chatService";

interface AdminChatWidgetProps {
  user: UserProfile | null;
}

export default function AdminChatWidget({ user }: AdminChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll for messages when open
  useEffect(() => {
    if (!isOpen || !user?.email) return;

    let active = true;

    const loadMessages = async () => {
      try {
        const data = await fetchChatMessages(user.email, false);
        if (active) {
          setMessages(data);
          setError("");
        }
      } catch (err) {
        console.error("Error polling chat messages:", err);
      }
    };

    setLoading(true);
    loadMessages().finally(() => setLoading(false));

    const interval = setInterval(loadMessages, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isOpen, user?.email]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user?.email || sending) return;

    const messageText = text.trim();
    setText("");
    setSending(true);

    try {
      const sent = await sendChatMessage({
        userId: user.email, // Use email as user ID for easy support mapping
        senderEmail: user.email,
        senderName: user.name || "Customer",
        message: messageText,
        isAdmin: false
      });
      setMessages(prev => [...prev, sent]);
      setError("");
    } catch (err: any) {
      setError("Failed to send message: " + (err.message || err));
    } finally {
      setSending(false);
    }
  };

  if (!user || !user.email) return null; // Only show for signed-in users

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="admin-chat-widget">
      {/* Floating Chat Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-[#1A1C20] hover:bg-[#D4AF37] hover:text-black text-white rounded-full shadow-2xl transition-all scale-100 hover:scale-105 cursor-pointer border border-[#E5E1D8]/20"
        >
          <MessageSquare className="w-5 h-5 text-[#D4AF37] animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider">Chat with Admin</span>
        </button>
      )}

      {/* Chat window panel */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[520px] bg-white border border-[#E5E1D8] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-[#1A1C20] text-white p-4 flex items-center justify-between border-b border-[#E5E1D8]/20">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center font-serif text-black font-extrabold shadow-sm">
                NK
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Noman Khan</h3>
                <p className="text-[10px] text-[#D4AF37] font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-[#3ebd5c] rounded-full animate-ping" />
                  <span>Yarana Admin &bull; Online</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Secure chat warning banner */}
          <div className="bg-[#F9F8F6] px-4 py-2 border-b border-[#E5E1D8]/60 flex items-center gap-2 text-[10px] text-gray-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
            <span>Secure direct messaging channel. We do not share logs.</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAF9F6]">
            {loading && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-[#D4AF37]" />
                <span className="text-xs">Loading secure channel...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="p-3 bg-white border border-[#E5E1D8]/60 rounded-full text-gray-400 inline-flex">
                  <MessageSquare className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <h4 className="text-xs font-bold text-gray-700">No Messages Yet</h4>
                <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                  Hi {user.name || "there"}! Send a direct message to Admin Noman Khan if you need booking help, verification, or refund requests.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = !msg.isAdmin;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="text-[9px] text-gray-400 font-mono mb-1 px-1">
                      {isMe ? "You" : "Noman Khan (Admin)"}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                        isMe
                          ? "bg-[#1A1C20] text-white rounded-tr-none text-left"
                          : "bg-white border border-[#E5E1D8] text-gray-800 rounded-tl-none text-left"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    </div>
                    <span className="text-[8px] text-gray-400 font-mono mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border-t border-red-100 text-red-700 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer input form */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-[#E5E1D8] flex items-center gap-2">
            <input
              type="text"
              placeholder="Type your message to Noman Khan..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={sending}
              className="flex-1 py-2.5 px-3.5 text-xs bg-[#F9F8F6] border border-[#E5E1D8] rounded-xl focus:outline-none focus:border-[#D4AF37] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="p-2.5 bg-[#1A1C20] hover:bg-[#D4AF37] text-white hover:text-black rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-[#1A1C20] disabled:hover:text-white cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
