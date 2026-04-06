import React, { useState, useEffect } from 'react';
import { ShoppingCart, HeadphonesIcon, Sparkles, Megaphone, BarChart2, Settings, ChevronDown, ChevronUp, Save, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCompany } from '../context/CompanyContext';

const defaultAgents = [
  { id: 'sales', name: 'Sales Agent', desc: 'Product recommendations, upselling, and closing sales via WhatsApp', status: 'Active', convos: 0, success: '0%', icon: ShoppingCart,
    prompt: 'You are a smart sales assistant. Suggest relevant products/services, ask follow-up questions, and be friendly and short.' },
  { id: 'support', name: 'Customer Support', desc: 'Answer queries, handle complaints, and track orders', status: 'Active', convos: 0, success: '0%', icon: HeadphonesIcon,
    prompt: 'You are a helpful customer support agent. Resolve issues quickly, provide order status, and escalate when needed.' },
  { id: 'recommend', name: 'Recommendation Agent', desc: 'Personalized product suggestions using customer history', status: 'Active', convos: 0, success: '0%', icon: Sparkles,
    prompt: 'You are a product recommendation engine. Analyze customer history and suggest similar/complementary products.' },
  { id: 'marketing', name: 'Marketing Agent', desc: 'Campaign messages, promotional offers, and follow-ups', status: 'Paused', convos: 0, success: '0%', icon: Megaphone,
    prompt: 'You are a marketing assistant. Create compelling offers, handle campaign responses, and track engagement.' },
  { id: 'analytics', name: 'Analytics Agent', desc: 'Generate insights and automated business reports', status: 'Active', convos: 0, success: '0%', icon: BarChart2,
    prompt: 'You are a business analytics agent. Provide insights on sales trends, customer behavior, and performance metrics.' },
];

const AiAgents = () => {
  const [agents, setAgents] = useState(defaultAgents);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const { activeCompanyId } = useCompany();

  useEffect(() => {
    if (!activeCompanyId) return;

    // Load or Initialize Agent Configs
    const loadConfigs = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'companies', activeCompanyId, 'configs', 'ai_agents');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const cloudData = docSnap.data();
          setAgents(defaultAgents.map(da => ({
            ...da,
            ...(cloudData[da.id] || {})
          })));
        } else {
          // Initialize with defaults if it doesn't exist
          const initialData = {};
          defaultAgents.forEach(a => { initialData[a.id] = { status: a.status, prompt: a.prompt }; });
          await setDoc(docRef, initialData);
        }
      } catch (err) {
        console.error("Error loading agent configs:", err);
      } finally {
        setLoading(false);
      }
    };

    loadConfigs();
  }, [activeCompanyId]);

  const saveAgentConfig = async (agentId, updates) => {
    setSavingId(agentId);
    try {
      const docRef = doc(db, 'companies', activeCompanyId, 'configs', 'ai_agents');
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.exists() ? docSnap.data() : {};
      
      const newData = {
        ...currentData,
        [agentId]: {
          ...(currentData[agentId] || {}),
          ...updates
        }
      };

      await setDoc(docRef, newData);
      
      // Update local state
      setAgents(agents.map(a => a.id === agentId ? { ...a, ...updates } : a));
    } catch (err) {
      console.error("Error saving agent config:", err);
      alert("Failed to save configuration.");
    } finally {
      setSavingId(null);
    }
  };

  const toggleStatus = (id) => {
    const agent = agents.find(a => a.id === id);
    const newStatus = agent.status === 'Active' ? 'Paused' : 'Active';
    saveAgentConfig(id, { status: newStatus });
  };

  const updatePromptLocally = (id, prompt) => {
    setAgents(agents.map(a => a.id === id ? { ...a, prompt } : a));
  };

  const getIcon = (id) => {
    switch(id) {
        case 'sales': return ShoppingCart;
        case 'support': return HeadphonesIcon;
        case 'recommend': return Sparkles;
        case 'marketing': return Megaphone;
        case 'analytics': return BarChart2;
        default: return Settings;
    }
  }

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-text-muted">
        <Loader2 className="animate-spin text-brand-green" size={40} />
        <p className="font-medium italic">Synchronizing AI Agent configurations...</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border-color p-4 shadow-sm">
          <span className="text-[12px] text-text-muted font-semibold uppercase">Active Agents</span>
          <div className="text-2xl font-bold text-brand-green mt-1">{agents.filter(a => a.status === 'Active').length}</div>
        </div>
        <div className="bg-white rounded-xl border border-border-color p-4 shadow-sm">
          <span className="text-[12px] text-text-muted font-semibold uppercase">Total Conversations</span>
          <div className="text-2xl font-bold text-text-main mt-1">{agents.reduce((s, a) => s + (a.convos || 0), 0)}</div>
        </div>
        <div className="bg-white rounded-xl border border-border-color p-4 shadow-sm">
          <span className="text-[12px] text-text-muted font-semibold uppercase">Avg Success Rate</span>
          <div className="text-2xl font-bold text-text-main mt-1">{Math.round(agents.reduce((s, a) => s + parseInt(a.success || 0), 0) / agents.length)}%</div>
        </div>
        <div className="bg-white rounded-xl border border-border-color p-4 shadow-sm">
          <span className="text-[12px] text-text-muted font-semibold uppercase">Paused</span>
          <div className="text-2xl font-bold text-amber-500 mt-1">{agents.filter(a => a.status === 'Paused').length}</div>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {agents.map(agent => {
          const Icon = getIcon(agent.id);
          const isActive = agent.status === 'Active';
          const isExpanded = expandedId === agent.id;
          const isSaving = savingId === agent.id;
          
          return (
            <div key={agent.id} className="bg-white rounded-xl border border-border-color shadow-sm hover:shadow-md transition-all overflow-hidden relative">
              {isSaving && (
                <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center backdrop-blur-[1px]">
                  <Loader2 className="animate-spin text-brand-green" size={24} />
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-gradient-to-br from-brand-green to-teal-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-semibold text-text-main">{agent.name}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>{agent.status}</span>
                      </div>
                      <span className="text-[13px] text-text-muted">{agent.desc}</span>
                    </div>
                  </div>
                  <div onClick={() => toggleStatus(agent.id)} className={`w-11 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors shrink-0 ${isActive ? 'bg-brand-green justify-end' : 'bg-slate-300 justify-start'}`}>
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>

                <div className="flex gap-8 pt-4 border-t border-border-color mb-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-lg font-bold text-text-main">{agent.convos || 0}</span>
                    <span className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">Conversations</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-lg font-bold text-brand-green">{agent.success || '0%'}</span>
                    <span className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">Success Rate</span>
                  </div>
                </div>

                <button onClick={() => setExpandedId(isExpanded ? null : agent.id)}
                  className={`flex items-center gap-1.5 text-[13px] font-medium transition-colors ${isActive ? 'text-brand-green hover:text-brand-green-hover' : 'text-slate-400'}`}>
                  <Settings size={14} /> Configure Prompt
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Expandable Prompt Config */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-dashed border-border-color bg-slate-50/50">
                  <label className="text-[12px] font-medium text-text-muted uppercase tracking-wide mb-2 block">System Prompt</label>
                  <textarea
                    value={agent.prompt}
                    onChange={e => updatePromptLocally(agent.id, e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2.5 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green resize-none bg-white"
                  />
                  <div className="flex justify-end mt-3">
                    <button 
                      onClick={() => saveAgentConfig(agent.id, { prompt: agent.prompt })}
                      className="bg-brand-green hover:bg-brand-green-hover text-white px-4 py-2 rounded-lg text-[13px] font-medium shadow-sm transition-all flex items-center gap-2">
                       <Save size={14} /> Save Prompt
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AiAgents;
