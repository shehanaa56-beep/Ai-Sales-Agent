import React from 'react';
import { Search, User, Bot } from 'lucide-react';

const conversations = [
  { id: 1, name: 'Arjun K.', message: 'I want to reorder the same items from last month', agent: 'Sales Agent', type: 'text-brand-green', time: '2 min ago', source: 'WhatsApp', unread: true },
  { id: 2, name: 'Meera S.', message: "What's the status of my order #2840?", agent: 'Support Agent', type: 'text-blue-500', time: '15 min ago', source: 'WhatsApp', unread: true },
  { id: 3, name: 'Ravi M.', message: 'Can you suggest something similar to the blue kurta?', agent: 'Recommendation Agent', type: 'text-purple-500', time: '1 hr ago', source: 'Web Chat', unread: false },
  { id: 4, name: 'Priya L.', message: 'Thank you! The delivery was perfect.', agent: 'Support Agent', type: 'text-blue-500', time: '2 hrs ago', source: 'WhatsApp', unread: false },
  { id: 5, name: 'Anil R.', message: 'Do you have any offers on bulk orders?', agent: 'Sales Agent', type: 'text-brand-green', time: '3 hrs ago', source: 'Web Chat', unread: false },
  { id: 6, name: 'Deepa V.', message: 'I need to change the delivery address', agent: 'Support Agent', type: 'text-blue-500', time: '4 hrs ago', source: 'WhatsApp', unread: false }
];

const Conversations = () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-lg border border-border-color px-4 py-3 flex items-center gap-3 shadow-sm">
        <Search size={18} className="text-text-muted" />
        <input type="text" placeholder="Search conversations..." className="border-none w-full text-sm outline-none placeholder:text-text-muted" />
      </div>

      {conversations.map(conv => (
        <div key={conv.id} className="bg-white rounded-lg border border-border-color p-4 sm:p-5 flex justify-between items-center cursor-pointer transition-colors hover:border-slate-300 shadow-sm">
          <div className="flex items-start gap-4 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-text-muted shrink-0">
              <User size={20} />
            </div>
            <div className="flex flex-col gap-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[15px] text-text-main">{conv.name}</span>
                {conv.unread && <span className="w-2 h-2 rounded-full bg-brand-green"></span>}
              </div>
              <span className="text-sm text-text-muted truncate max-w-[200px] sm:max-w-md md:max-w-lg lg:max-w-2xl">{conv.message}</span>
              <div className={`flex items-center gap-1.5 text-xs font-medium mt-1 ${conv.type}`}>
                <Bot size={14} /> {conv.agent}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-xs text-text-muted">{conv.time}</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border border-border-color text-text-muted bg-slate-50">{conv.source}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Conversations;
