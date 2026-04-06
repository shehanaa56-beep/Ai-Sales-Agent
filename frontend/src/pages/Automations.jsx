import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc, setDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCompany } from '../context/CompanyContext';
import { MessageSquare, ShoppingCart, RefreshCcw, Bell, Send, MessageCircle, ArrowRight, Plus, X, Calendar, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const defaultAutos = [
  { id: 'welcome', name: 'Welcome Message', badge: 'support', desc: 'Send greeting when new customer initiates chat', trigger: 'New conversation', icon: MessageSquare, on: true, runs: '0' },
  { id: 'abandon', name: 'Abandoned Cart Recovery', badge: 'sales', desc: 'Follow up with customers who left items in cart', trigger: 'Cart idle > 1hr', icon: ShoppingCart, on: true, runs: '0' },
  { id: 'repeat', name: 'Repeat Order Reminder', badge: 'sales', desc: 'Remind customers to reorder when usage_days expires', trigger: 'purchase_date + usage_days', icon: RefreshCcw, on: true, runs: '0' },
  { id: 'order', name: 'Order Confirmation', badge: 'support', desc: 'Send order details and tracking info after purchase', trigger: 'Order placed', icon: Bell, on: true, runs: '0' },
  { id: 'birthday', name: 'Birthday Reminder', badge: 'marketing', desc: 'Send birthday wishes & cake/gift offers 2 days before', trigger: 'birthday - 2 days', icon: Calendar, on: true, runs: '0' },
  { id: 'promo', name: 'Promotional Broadcast', badge: 'marketing', desc: 'Send offers and deals to segmented customer lists', trigger: 'Scheduled / Manual', icon: Send, on: false, runs: '0' },
];

const Automations = () => {
  const [activeTab, setActiveTab] = useState('Automations');
  const [autos, setAutos] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAuto, setNewAuto] = useState({ name: '', badge: '', trigger: '', desc: '' });
  const { activeCompanyId } = useCompany();

  useEffect(() => {
    if (!activeCompanyId) return;
    loadData();
  }, [activeCompanyId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Scheduled Follow-ups
      const fQuery = query(collection(db, 'followups'), where('companyId', '==', activeCompanyId));
      const fSnap = await getDocs(fQuery);
      setFollowups(fSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 2. Load Automation Configs
      const docRef = doc(db, 'companies', activeCompanyId, 'configs', 'automations');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        setAutos(defaultAutos.map(da => ({
          ...da,
          on: cloudData[da.id]?.on ?? da.on,
          runs: cloudData[da.id]?.runs ?? da.runs
        })));
      } else {
        // Initialize
        const initialData = {};
        defaultAutos.forEach(a => { initialData[a.id] = { on: a.on, runs: a.runs }; });
        await setDoc(docRef, initialData);
        setAutos(defaultAutos);
      }
    } catch (err) {
      console.error("Error loading automations:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuto = async (id) => {
    const newAutos = autos.map(a => a.id === id ? { ...a, on: !a.on } : a);
    setAutos(newAutos);
    
    try {
      const docRef = doc(db, 'companies', activeCompanyId, 'configs', 'automations');
      const updatedItem = newAutos.find(a => a.id === id);
      
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.exists() ? docSnap.data() : {};
      
      await setDoc(docRef, {
        ...currentData,
        [id]: {
          on: updatedItem.on,
          runs: updatedItem.runs
        }
      });
    } catch (err) {
      console.error("Error toggling automation:", err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newAuto.name || !newAuto.badge || !newAuto.trigger || !newAuto.desc) return;
    
    const id = `custom_${Date.now()}`;
    const added = { id, ...newAuto, icon: Send, on: true, runs: '0' };
    setAutos([added, ...autos]);
    setShowModal(false);
    setNewAuto({ name: '', badge: '', trigger: '', desc: '' });

    try {
      const docRef = doc(db, 'companies', activeCompanyId, 'configs', 'automations');
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.exists() ? docSnap.data() : {};
      
      await setDoc(docRef, {
        ...currentData,
        [id]: { on: true, runs: '0', name: added.name, badge: added.badge, trigger: added.trigger, desc: added.desc }
      });
    } catch (err) {
      console.error("Error adding automation:", err);
    }
  };

  const getIcon = (iconName) => {
    switch(iconName) {
        case MessageSquare: return MessageSquare;
        case ShoppingCart: return ShoppingCart;
        case RefreshCcw: return RefreshCcw;
        case Bell: return Bell;
        case Calendar: return Calendar;
        case Clock: return Clock;
        default: return Send;
    }
  }

  const getTypeColor = (type) => {
    if (type === 'repeat') return 'bg-blue-50 text-blue-600 border-blue-200';
    if (type === 'birthday') return 'bg-pink-50 text-pink-600 border-pink-200';
    if (type === 'checkup') return 'bg-purple-50 text-purple-600 border-purple-200';
    return 'bg-amber-50 text-amber-600 border-amber-200';
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-text-muted">
        <Loader2 className="animate-spin text-brand-green" size={40} />
        <p className="font-medium italic">Synchronizing automation workflows...</p>
    </div>
  )

  const pendingFollowups = followups.filter(f => f.status === 'pending');
  const sentFollowups = followups.filter(f => f.status === 'sent');
  const activeCount = autos.filter(a => a.on).length;

  return (
    <div className="flex flex-col relative">
      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        {['Automations', 'Scheduled Follow-ups'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all ${
              activeTab === tab ? 'bg-brand-green text-white shadow-md' : 'bg-white text-text-muted border border-border-color hover:border-slate-300'
            }`}>{tab}
            {tab === 'Scheduled Follow-ups' && pendingFollowups.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-bold">{pendingFollowups.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'Automations' ? (
        <>
          <div className="flex justify-between items-center mb-5">
            <div className="text-sm text-text-muted">{activeCount} of {autos.length} automations active</div>
            <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Create Automation</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {autos.map(auto => {
              const Icon = typeof auto.icon === 'string' ? Send : (auto.icon || Send);
              return (
                <div key={auto.id} className="bg-white rounded-xl border border-border-color p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-brand-green-light text-brand-green flex items-center justify-center ${auto.on ? '' : 'opacity-50'}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-semibold text-text-main">{auto.name}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium w-fit ${
                          auto.badge === 'sales' ? 'bg-blue-50 text-blue-600' :
                          auto.badge === 'support' ? 'bg-emerald-50 text-emerald-600' :
                          'bg-purple-50 text-purple-600'
                        }`}>{auto.badge}</span>
                      </div>
                    </div>
                    <div onClick={() => toggleAuto(auto.id)} className={`w-11 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors shrink-0 ${auto.on ? 'bg-brand-green justify-end' : 'bg-slate-300 justify-start'}`}>
                      <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
                    </div>
                  </div>
                  <p className="text-[13px] text-text-muted mb-2 leading-relaxed">{auto.desc}</p>
                  <div className="text-[12px] text-text-muted flex items-center gap-1.5 mb-4">
                    <ArrowRight size={12} /> Trigger: <strong className="text-text-main">{auto.trigger}</strong>
                  </div>
                  <div className="pt-3 border-t border-dashed border-border-color text-xs text-text-muted flex justify-between">
                    <span className={`font-medium ${auto.on ? 'text-brand-green' : 'text-slate-400'}`}>{auto.on ? '● Active' : '○ Paused'}</span>
                    <span className="font-medium text-slate-600">{auto.runs} runs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Scheduled Follow-ups Tab */
        <div className="flex flex-col gap-5">
          {/* Pending */}
          <div>
            <h3 className="text-sm font-semibold text-text-main mb-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" /> Pending ({pendingFollowups.length})
            </h3>
            {pendingFollowups.length === 0 ? (
                <div className="bg-slate-50 rounded-xl p-10 border-2 border-dashed border-slate-200 text-center text-slate-400">
                    <Clock className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">No pending follow-ups scheduled.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingFollowups.map((f, i) => (
                    <div key={i} className="bg-white rounded-xl border border-border-color p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col gap-1">
                        <span className="text-[14px] font-semibold text-text-main">{f.customer_name || f.customer_phone}</span>
                        <span className="text-[12px] text-text-muted">{f.product}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getTypeColor(f.type)}`}>{f.type}</span>
                    </div>
                    <p className="text-[13px] text-slate-600 bg-slate-50 rounded-lg p-3 mb-3 leading-relaxed">💬 {f.message}</p>
                    <div className="flex justify-between items-center text-[12px]">
                        <span className="text-text-muted flex items-center gap-1"><Calendar size={12} /> Send: <strong className="text-text-main">{f.send_date}</strong></span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium border border-amber-200">⏳ Pending</span>
                    </div>
                    </div>
                ))}
                </div>
            )}
          </div>

          {/* Sent */}
          <div>
            <h3 className="text-sm font-semibold text-text-main mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-brand-green" /> Sent ({sentFollowups.length})
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sentFollowups.map((f, i) => (
                <div key={i} className="bg-white rounded-xl border border-border-color p-5 shadow-sm opacity-70">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-[14px] font-semibold text-text-main">{f.customer_name || f.customer_phone}</span>
                      <span className="text-[12px] text-text-muted">{f.product}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getTypeColor(f.type)}`}>{f.type}</span>
                  </div>
                  <p className="text-[13px] text-slate-500 bg-slate-50 rounded-lg p-3 mb-3">💬 {f.message}</p>
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="text-text-muted flex items-center gap-1"><Calendar size={12} /> Sent: {f.send_date}</span>
                    <span className="px-2 py-0.5 rounded-full bg-brand-green-light text-brand-green font-medium">✅ Sent</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <h2 className="text-lg font-semibold text-text-main mb-1">Create Automation</h2>
            <p className="text-[13px] text-text-muted mb-6">Configure a new AI-powered workflow.</p>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Name</label>
                <input required value={newAuto.name} onChange={e => setNewAuto({...newAuto, name: e.target.value})} type="text" placeholder="e.g. VIP Greeting"
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Category</label>
                <select required value={newAuto.badge} onChange={e => setNewAuto({...newAuto, badge: e.target.value})}
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white appearance-none">
                  <option value="" disabled>Select</option>
                  <option value="sales">sales</option>
                  <option value="support">support</option>
                  <option value="marketing">marketing</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Trigger</label>
                <input required value={newAuto.trigger} onChange={e => setNewAuto({...newAuto, trigger: e.target.value})} type="text" placeholder="e.g. Cart value > ₹5000"
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Description</label>
                <textarea required value={newAuto.desc} onChange={e => setNewAuto({...newAuto, desc: e.target.value})} placeholder="What should the AI do?"
                  rows={3} className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green resize-none"></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-border-color">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg font-medium text-[13px] text-text-muted hover:bg-slate-50">Cancel</button>
                <button type="submit" className="bg-brand-green hover:bg-brand-green-hover text-white px-5 py-2 rounded-lg font-medium text-[13px] shadow-sm">Enable</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automations;
