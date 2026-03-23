import React from 'react';
import { 
  LayoutDashboard, MessageSquare, ShoppingCart, Users, Package,
  Bot, BarChart2, Zap, Settings as SettingsIcon
} from 'lucide-react';

const Sidebar = ({ activePage, setActivePage }) => {
  const mainNav = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Conversations', icon: <MessageSquare size={18} /> },
    { name: 'Orders', icon: <ShoppingCart size={18} /> },
    { name: 'Customers', icon: <Users size={18} /> },
    { name: 'Products', icon: <Package size={18} /> },
  ];

  const intelNav = [
    { name: 'AI Agents', icon: <Bot size={18} /> },
    { name: 'Analytics', icon: <BarChart2 size={18} /> },
    { name: 'Automations', icon: <Zap size={18} /> },
  ];

  const NavItem = ({ item }) => {
    const isActive = activePage === item.name;
    return (
      <div 
        onClick={() => setActivePage(item.name)}
        className={`flex items-center gap-3 px-6 py-2.5 cursor-pointer transition-colors text-sm font-medium ${
          isActive 
            ? 'bg-sidebar-bg-active text-sidebar-text-active border-l-[3px] border-l-brand-green pl-[21px]' 
            : 'text-sidebar-text hover:bg-sidebar-item-hover hover:text-white border-l-[3px] border-transparent'
        }`}
      >
        {item.icon}
        <span>{item.name}</span>
      </div>
    );
  };

  return (
    <div className="w-[260px] bg-sidebar-bg flex flex-col py-6 border-r border-white/5 shrink-0">
      <div className="px-6 pb-8 flex items-center gap-3">
        <div className="w-9 h-9 bg-brand-green rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
          AI
        </div>
        <div className="flex flex-col">
          <span className="text-white font-semibold text-base leading-tight">AI Sales Agent</span>
          <span className="text-sidebar-text text-xs">Business Suite</span>
        </div>
      </div>

      <div className="flex flex-col mb-8">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 px-6 mb-3 font-semibold">MAIN</div>
        {mainNav.map(item => <NavItem key={item.name} item={item} />)}
      </div>

      <div className="flex flex-col mb-8">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 px-6 mb-3 font-semibold">INTELLIGENCE</div>
        {intelNav.map(item => <NavItem key={item.name} item={item} />)}
      </div>

      <div className="mt-auto pb-4">
        <NavItem item={{ name: 'Settings', icon: <SettingsIcon size={18} /> }} />
      </div>
    </div>
  );
};

export default Sidebar;
