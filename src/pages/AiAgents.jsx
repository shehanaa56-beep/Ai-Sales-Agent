import React, { useState } from 'react';
import { ShoppingCart, HeadphonesIcon, Sparkles, Megaphone, BarChart2 } from 'lucide-react';

const initialAgents = [
  { id: 1, name: 'Sales Agent', desc: 'Product recommendations, upselling, and closing sales', status: 'Active', convos: 142, success: '90%', icon: ShoppingCart },
  { id: 2, name: 'Customer Support', desc: 'Answer queries and handle complaints', status: 'Active', convos: 98, success: '93%', icon: HeadphonesIcon },
  { id: 3, name: 'Recommendation Agent', desc: 'Personalized product suggestions using RAG', status: 'Active', convos: 76, success: '100%', icon: Sparkles },
  { id: 4, name: 'Marketing Agent', desc: 'Campaign messages and follow-ups', status: 'Paused', convos: 54, success: '89%', icon: Megaphone },
  { id: 5, name: 'Analytics Agent', desc: 'Insights and automated reports', status: 'Active', convos: 32, success: '95%', icon: BarChart2 },
];

const AiAgents = () => {
  const [agents, setAgents] = useState(initialAgents);

  const toggleStatus = (id) => {
    setAgents(agents.map(a => {
      if(a.id === id) {
        return { ...a, status: a.status === 'Active' ? 'Paused' : 'Active' };
      }
      return a;
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {agents.map(agent => {
        const Icon = agent.icon;
        const isActive = agent.status === 'Active';
        return (
          <div key={agent.id} className="bg-white rounded-lg border border-border-color p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-brand-green-light text-brand-green flex items-center justify-center shrink-0">
                  <Icon size={24} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-text-main">{agent.name}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{agent.status}</span>
                  </div>
                  <span className="text-[13px] text-text-muted max-w-[280px]">{agent.desc}</span>
                </div>
              </div>
              <div onClick={() => toggleStatus(agent.id)} className={`w-11 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors shrink-0 ${isActive ? 'bg-brand-green justify-end' : 'bg-slate-300 justify-start'}`}>
                <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            
            <div className="flex gap-12 pt-4 border-t border-border-color">
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold text-text-main">{agent.convos}</span>
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">Conversations</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold text-brand-green">{agent.success}</span>
                <span className="text-[11px] uppercase tracking-wide text-text-muted font-semibold">Success Rate</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  );
};

export default AiAgents;
