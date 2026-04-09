import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCompany } from '../context/CompanyContext';
import { Search, X, Bot, User, Send, MessageSquare } from 'lucide-react';

const Conversations = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);

  const { activeCompanyId, selectedCustomer, setSelectedCustomer } = useCompany();

  console.log("API URL:", import.meta.env.VITE_FUNCTIONS_URL);
  console.log("Company ID:", activeCompanyId);

  useEffect(() => {
    loadConversations();
  }, [activeCompanyId]);

  // Handle proactive messaging from Customers page
  useEffect(() => {
    if (selectedCustomer) {
      // Check if conversation already exists in our list
      const existing = conversations.find(c => c.phone === selectedCustomer.phone);
      if (existing) {
        setSelectedConv(existing);
      } else {
        // Create a temporary "New Chat" preview
        setSelectedConv({
          phone: selectedCustomer.phone,
          name: selectedCustomer.name,
          messages: [],
          agent: 'Manual (New)',
          isNew: true
        });
      }
      // Clear the selection so it doesn't trigger again on refresh
      setSelectedCustomer(null);
    }
  }, [selectedCustomer, conversations]);

  const loadConversations = async () => {
    if (!activeCompanyId) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'conversations'), 
        where('companyId', '==', activeCompanyId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const snap = await getDocs(q);
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Group by phone
      const grouped = {};
      msgs.forEach(m => {
        const phone = m.phone || 'Unknown';
        if (!grouped[phone]) {
          grouped[phone] = { 
            phone, 
            name: m.customer_name || null,
            messages: [], 
            lastTime: '',
            agent: m.agent || 'AI Specialist',
            unread: false
          };
        }
        
        grouped[phone].messages.push({
          message: m.inbound,
          reply: m.outbound,
          timestamp: m.timestamp?.toDate ? m.timestamp.toDate().toLocaleString() : 'Recent'
        });
        
        if (!grouped[phone].lastTime && m.timestamp) {
          grouped[phone].lastTime = m.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      });

      // Reverse messages for each group (oldest -> newest)
      const finalConversations = Object.values(grouped);
      finalConversations.forEach(g => g.messages.reverse());

      setConversations(finalConversations);
    } catch (err) {
      console.error("Error loading conversations:", err);
      if (err.code === 'failed-precondition' || err.message?.includes('index')) {
        setError("Missing Firestore Index. Please check your browser's F12 console for the link to create it.");
      } else {
        setError("Failed to load conversations. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConv || sending) return;

    setSending(true);
    try {
      // Call the backend broadcastMessage endpoint (reused for single manual message)
      const response = await fetch(`${import.meta.env.VITE_FUNCTIONS_URL}/broadcastMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: activeCompanyId,
          phones: [selectedConv.phone],
          message: messageText
        })
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Update local UI immediately
      const newMsg = {
        message: null,
        reply: messageText,
        timestamp: new Date().toLocaleString()
      };

      if (selectedConv.isNew) {
        // If it was a new chat, add it to the list
        const updatedConv = { ...selectedConv, messages: [newMsg], isNew: false, lastTime: 'Just now' };
        setConversations([updatedConv, ...conversations]);
        setSelectedConv(updatedConv);
      } else {
        setSelectedConv({
          ...selectedConv,
          messages: [...selectedConv.messages, newMsg]
        });
      }

      setMessageText('');
    } catch (err) {
      console.error("Send error:", err);
      alert("Failed to send message. Make sure the backend is running.");
    } finally {
      setSending(false);
    }
  };

  const getAgentColor = (agent) => {
    if (agent?.includes('Sales')) return 'text-brand-green';
    if (agent?.includes('Support')) return 'text-blue-500';
    if (agent?.includes('Recover')) return 'text-amber-500';
    return 'text-slate-500';
  };

  const filtered = conversations.filter(c =>
    (c.name || c.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.messages?.some(m => m.message?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex gap-5 h-[calc(100vh-10rem)] lg:h-[calc(100vh-12rem)] min-h-[500px]">
      {/* List */}
      <div className={`${selectedConv ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[380px] shrink-0`}>
        <div className="bg-white rounded-xl border border-border-color px-4 py-3 flex items-center gap-3 shadow-sm mb-4">
          <Search size={18} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border-none w-full text-sm outline-none placeholder:text-text-muted"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-text-muted italic bg-white rounded-2xl border border-dashed border-border-color">
              Searching for chats...
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm flex flex-col gap-2">
              <span className="font-bold">Error</span>
              <span>{error}</span>
              <p className="text-xs pt-1">If this is a new collection, click the indexing link in your browser console.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-text-muted bg-white rounded-2xl border border-dashed border-border-color gap-3">
              <MessageSquare size={40} className="text-slate-200" />
              <div className="text-center px-4">
                <p className="font-semibold text-text-main">No conversations yet</p>
                <p className="text-xs">Incoming WhatsApp messages will appear here.</p>
              </div>
            </div>
          ) : (
            filtered.map((conv, i) => (
              <div
                key={i}
                onClick={() => setSelectedConv(conv)}
                className={`bg-white rounded-xl border p-4 flex justify-between items-center cursor-pointer transition-all shadow-sm ${
                  selectedConv?.phone === conv.phone
                    ? 'border-brand-green bg-brand-green-light/30 shadow-md'
                    : 'border-border-color hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-green to-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {(conv.name || conv.phone || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="font-semibold text-[14px] text-text-main">{conv.name || conv.phone}</span>
                    <span className="text-[13px] text-text-muted truncate">
                      {conv.messages?.[conv.messages.length - 1]?.message || conv.messages?.[conv.messages.length - 1]?.reply || ''}
                    </span>
                    <div className={`flex items-center gap-1 text-[11px] font-medium mt-0.5 ${getAgentColor(conv.agent)}`}>
                      <Bot size={12} /> {conv.agent}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                  <span className="text-[11px] text-text-muted">{conv.lastTime}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-green-200 text-green-700 bg-green-50">API</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      <div className={`${selectedConv ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-white rounded-xl border border-border-color shadow-sm overflow-hidden`}>
        {selectedConv ? (
          <>
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border-color bg-slate-50/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand-green to-teal-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
                  {(selectedConv.name || selectedConv.phone || '?')[0].toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm sm:text-[15px] text-text-main truncate">{selectedConv.name || selectedConv.phone}</span>
                    <span className="hidden xs:block text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200 font-mono">
                      {selectedConv.phone}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-[12px] text-text-muted flex items-center gap-1 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span> <span className="truncate">Proactive Support Enabled</span>
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedConv(null)} className="lg:hidden text-slate-400 hover:text-slate-600 p-2 -mr-2">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 bg-slate-50/30">
              {selectedConv.messages?.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-2 opacity-60">
                   <Bot size={40} className="text-slate-300" />
                   <p className="text-sm italic text-center px-10">This customer hasn't messaged yet. <br/> Send a proactive message to start the conversation.</p>
                </div>
              ) : (
                selectedConv.messages.map((msg, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    {msg.message && (
                      <div className="flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[80%]">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 mt-1">
                          <User size={12} />
                        </div>
                        <div className="bg-white rounded-2xl rounded-tl-md px-3 sm:px-4 py-2 sm:py-3 border border-border-color shadow-sm">
                          <p className="text-sm text-text-main break-words">{msg.message}</p>
                          <span className="text-[10px] text-text-muted mt-1 block">{msg.timestamp}</span>
                        </div>
                      </div>
                    )}
                    {msg.reply && (
                      <div className="flex gap-2 sm:gap-3 max-w-[90%] sm:max-w-[80%] self-end flex-row-reverse">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-brand-green flex items-center justify-center text-white shrink-0 mt-1">
                          <Bot size={12} />
                        </div>
                        <div className="bg-brand-green/5 rounded-2xl rounded-tr-md px-3 sm:px-4 py-2 sm:py-3 border border-brand-green/20">
                          <p className="text-sm text-text-main break-words">{msg.reply}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-text-muted">{msg.timestamp}</span>
                            <span className="text-[10px] text-brand-green font-medium">Outbound</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Input Area */}
            <div className="px-4 sm:px-6 py-4 border-t border-border-color bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3 bg-slate-50 border border-border-color rounded-xl px-3 sm:px-4 py-2 focus-within:ring-2 focus-within:ring-brand-green/10 transition-all">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  disabled={sending}
                  onChange={e => setMessageText(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-sm py-1 placeholder:text-text-muted"
                />
                <button 
                  type="submit" 
                  disabled={sending || !messageText.trim()}
                  className={`p-2 rounded-lg transition-all shrink-0 ${
                    sending || !messageText.trim() ? 'text-slate-300' : 'text-brand-green hover:bg-brand-green-light'
                  }`}
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-3">
            <div className="w-16 h-16 rounded-2xl bg-brand-green-light flex items-center justify-center">
              <MessageSquare size={28} className="text-brand-green" />
            </div>
            <span className="text-base font-medium text-text-main">Select a conversation</span>
            <span className="text-sm px-10 text-center">View real-time customer and AI agent interactions from the live database.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;
