import React, { useState } from 'react';
import { MessageSquare, ShoppingCart, RefreshCcw, Bell, Send, MessageCircle, ArrowRight, Plus, X } from 'lucide-react';

const initialAutos = [
  { id: 1, name: 'Welcome Message', badge: 'support', desc: 'Send greeting when new customer initiates chat', trigger: 'New conversation', icon: MessageSquare, on: true, time: '2 min ago', runs: '1,243 runs' },
  { id: 2, name: 'Abandoned Cart Recovery', badge: 'sales', desc: 'Follow up with customers who left items in cart', trigger: 'Cart idle > 1hr', icon: ShoppingCart, on: true, time: '15 min ago', runs: '856 runs' },
  { id: 3, name: 'Repeat Order Reminder', badge: 'sales', desc: 'Remind customers to reorder frequently purchased items', trigger: '30 days since last order', icon: RefreshCcw, on: true, time: '1 hr ago', runs: '432 runs' },
  { id: 4, name: 'Order Confirmation', badge: 'support', desc: 'Send order details and tracking info after purchase', trigger: 'Order placed', icon: Bell, on: true, time: '5 min ago', runs: '2,187 runs' },
  { id: 5, name: 'Promotional Broadcast', badge: 'marketing', desc: 'Send offers and deals to segmented customer lists', trigger: 'Scheduled / Manual', icon: Send, on: false, time: '3 days ago', runs: '98 runs' },
  { id: 6, name: 'Feedback Collection', badge: 'marketing', desc: 'Request review 3 days after delivery', trigger: 'Delivered + 3 days', icon: MessageCircle, on: false, time: '1 day ago', runs: '312 runs' },
];

const Automations = () => {
  const [autos, setAutos] = useState(initialAutos);
  const [showModal, setShowModal] = useState(false);
  const [newAuto, setNewAuto] = useState({ name: '', badge: '', trigger: '', desc: '' });

  const toggleStatus = (id) => {
    setAutos(autos.map(a => a.id === id ? { ...a, on: !a.on } : a));
  };

  const activeCount = autos.filter(a => a.on).length;

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newAuto.name || !newAuto.badge || !newAuto.trigger || !newAuto.desc) return;
    
    const added = {
      id: Date.now(),
      name: newAuto.name,
      badge: newAuto.badge,
      desc: newAuto.desc,
      trigger: newAuto.trigger,
      icon: Send,
      on: true,
      time: 'Just now',
      runs: '0 runs'
    };
    
    setAutos([added, ...autos]);
    setShowModal(false);
    setNewAuto({ name: '', badge: '', trigger: '', desc: '' });
  };

  return (
    <div className="flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-text-muted">{activeCount} of {autos.length} automations active</div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Create Automation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {autos.map(auto => {
          const Icon = auto.icon;
          return (
            <div key={auto.id} className="bg-white rounded-lg border border-border-color p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-brand-green-light text-brand-green flex items-center justify-center ${auto.on ? 'opacity-100' : 'opacity-60'}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[15px] font-semibold text-text-main">{auto.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 w-fit">{auto.badge}</span>
                  </div>
                </div>
                <div onClick={() => toggleStatus(auto.id)} className={`w-11 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors shrink-0 ${auto.on ? 'bg-brand-green justify-end' : 'bg-slate-300 justify-start'}`}>
                  <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
              <p className="text-[13px] text-text-muted mb-3 leading-relaxed">{auto.desc}</p>
              <div className="text-[13px] text-text-muted flex items-center gap-1.5 mb-6">
                <ArrowRight size={14} /> Trigger: {auto.trigger}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-dashed border-border-color text-xs text-text-muted">
                <span>{auto.time}</span>
                <span className="font-medium text-slate-600">{auto.runs}</span>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold text-text-main mb-1">Create Automation</h2>
            <p className="text-[13px] text-text-muted mb-6">Configure a new AI-powered workflow.</p>
            
            <form onSubmit={handleAdd} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Automation Name</label>
                <input required value={newAuto.name} onChange={e => setNewAuto({...newAuto, name: e.target.value})} type="text" placeholder="e.g. VIP Customer Greeting" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green shadow-sm" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Category Badge</label>
                <select required value={newAuto.badge} onChange={e => setNewAuto({...newAuto, badge: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green bg-white shadow-sm appearance-none">
                  <option value="" disabled>Select Category</option>
                  <option value="sales">sales</option>
                  <option value="support">support</option>
                  <option value="marketing">marketing</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Trigger Condition</label>
                <input required value={newAuto.trigger} onChange={e => setNewAuto({...newAuto, trigger: e.target.value})} type="text" placeholder="e.g. High cart value > $1000" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green shadow-sm" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Description / Action</label>
                <textarea required value={newAuto.desc} onChange={e => setNewAuto({...newAuto, desc: e.target.value})} placeholder="What should the AI do when triggered?" rows={3} className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green shadow-sm resize-none"></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-color">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-md font-medium text-[13px] text-text-muted hover:bg-slate-50 transition-colors border border-transparent">Cancel</button>
                <button type="submit" className="bg-brand-green hover:bg-brand-green-hover transition-colors text-white px-5 py-2 rounded-md font-medium text-[13px] shadow-sm">Enable Automation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automations;
