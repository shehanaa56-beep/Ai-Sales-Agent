import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCompany } from '../context/CompanyContext';
import { Search, Plus, Phone, User, X, MessageSquare } from 'lucide-react';

const Customers = ({ setActivePage }) => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', tags: 'Regular', preferences: '' });

  const { activeCompanyId, setSelectedCustomer } = useCompany();

  const handleMessageClick = (cust) => {
    setSelectedCustomer({
      phone: cust.phone,
      name: cust.name || 'Anonymous Lead'
    });
    setActivePage('Conversations');
  };

  useEffect(() => { loadCustomers(); }, [activeCompanyId]);

  const loadCustomers = async () => {
    try {
      const q = query(collection(db, 'leads'), where('companyId', '==', activeCompanyId));
      const snap = await getDocs(q);
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error loading customers:", err);

      setCustomers([
        { name: 'Arjun K.', phone: '+91 98765 43210', tags: ['VIP'], preferences: ['perfume', 'kurta'], total_spent: 28400, orders: 12, last_interaction: '2026-03-22', next_followup: '2026-04-01' },
        { name: 'Meera S.', phone: '+91 87654 32109', tags: ['Regular'], preferences: ['saree'], total_spent: 15200, orders: 8, last_interaction: '2026-03-22', next_followup: '2026-03-30' },
        { name: 'Ravi M.', phone: '+91 76543 21098', tags: ['Regular'], preferences: ['shirt'], total_spent: 9800, orders: 5, last_interaction: '2026-03-21', next_followup: null },
        { name: 'Priya L.', phone: '+91 65432 10987', tags: ['VIP'], preferences: ['blouse', 'dupatta'], total_spent: 42100, orders: 22, last_interaction: '2026-03-21', next_followup: '2026-03-28' },
        { name: 'Anil R.', phone: '+91 54321 09876', tags: ['New'], preferences: ['fabric'], total_spent: 6200, orders: 3, last_interaction: '2026-03-20', next_followup: null },
        { name: 'Deepa V.', phone: '+91 43210 98765', tags: ['VIP'], preferences: ['blouse', 'saree'], total_spent: 31500, orders: 15, last_interaction: '2026-03-20', next_followup: '2026-03-29' },
      ]);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    try {
      const added = {
        companyId: activeCompanyId,
        name: newCustomer.name, 
        phone: newCustomer.phone,
        status: 'new',
        tags: [newCustomer.tags],
        preferences: newCustomer.preferences ? newCustomer.preferences.split(',').map(s => s.trim()) : [],
        total_spent: 0,
        orders: 0,
        last_interaction: new Date().toISOString().split('T')[0],
        next_followup: null,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'leads'), added);
      setCustomers([{ id: docRef.id, ...added }, ...customers]);
      setShowModal(false);
      setNewCustomer({ name: '', phone: '', tags: 'Regular', preferences: '' });
    } catch (err) {
      console.error("Error adding customer:", err);
      alert("Failed to save customer. Please check your connection.");
    }
  };

  const allTags = ['All', 'new', 'warm', 'customer'];
  const filtered = customers.filter(c => {
    const matchSearch = (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone || '').includes(searchTerm);
    const matchTag = tagFilter === 'All' || (c.status || 'new') === tagFilter;
    return matchSearch && matchTag;
  });

  return (
    <div className="flex flex-col gap-5 relative">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 bg-white rounded-xl border border-border-color px-4 py-2.5 flex items-center gap-3 shadow-sm">
          <Search size={18} className="text-text-muted" />
          <input type="text" placeholder="Search customers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="border-none w-full text-sm outline-none placeholder:text-text-muted" />
        </div>
        <div className="flex gap-2">
          {allTags.map(t => (
            <button key={t} onClick={() => setTagFilter(t)}
              className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-colors border ${tagFilter === t ? 'bg-brand-green text-white border-brand-green' : 'bg-white text-text-muted border-border-color hover:border-slate-300'}`}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary shrink-0">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((cust, i) => {
          const status = cust.status || 'new';
          return (
            <div key={i} className="bg-white rounded-xl border border-border-color p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    status === 'customer' ? 'bg-gradient-to-br from-brand-green to-teal-600' :
                    status === 'warm' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                    'bg-gradient-to-br from-slate-400 to-slate-500'
                  }`}>
                    {(cust.name || '?')[0]}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                       <span className="text-[15px] font-semibold text-text-main">{cust.name || 'Anonymous Lead'}</span>
                       {cust.leadScore === 'hot' && <span className="text-orange-500" title="Hot Lead">🔥</span>}
                       {cust.leadScore === 'warm' && <span className="text-amber-500" title="Warm Lead">😎</span>}
                    </div>
                    <span className="text-[12px] text-text-muted flex items-center gap-1"><Phone size={11} /> {cust.phone}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={() => handleMessageClick(cust)}
                    className="p-2 bg-brand-green/10 text-brand-green rounded-lg hover:bg-brand-green hover:text-white transition-all shadow-sm"
                    title="Message Customer"
                  >
                    <MessageSquare size={16} />
                  </button>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    status === 'customer' ? 'bg-brand-green text-white shadow-sm' :
                    status === 'warm' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                    'bg-slate-100 text-slate-600'
                  }`}>{status}</span>
                  {cust.leadScore === 'hot' && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 uppercase tracking-tight">high intent</span>
                  )}
                </div>
              </div>

              {/* Preferences */}
              {(cust.preferences || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {cust.preferences.map((p, j) => (
                    <span key={j} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-brand-green-light text-brand-green">{p}</span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex justify-between items-center pt-4 border-t border-dashed border-border-color">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-base font-bold text-text-main">{cust.orders || 0}</span>
                  <span className="text-[11px] text-text-muted">Orders</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-base font-bold text-text-main">₹{(cust.total_spent || 0).toLocaleString('en-IN')}</span>
                  <span className="text-[11px] text-text-muted">Spent</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  {cust.next_followup ? (
                    <>
                      <span className="text-[12px] font-semibold text-brand-green">{cust.next_followup}</span>
                      <span className="text-[11px] text-text-muted">Follow-up</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[12px] text-slate-400">—</span>
                      <span className="text-[11px] text-text-muted">Follow-up</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <h2 className="text-lg font-semibold text-text-main mb-1">Add Customer</h2>
            <p className="text-[13px] text-text-muted mb-6">Add a new customer to your CRM.</p>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Name</label>
                <input required value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} type="text" placeholder="Customer name"
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Phone</label>
                <input required value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} type="text" placeholder="+91 XXXXX XXXXX"
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Tag</label>
                <select value={newCustomer.tags} onChange={e => setNewCustomer({...newCustomer, tags: e.target.value})}
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white appearance-none">
                  <option value="Regular">Regular</option>
                  <option value="VIP">VIP</option>
                  <option value="New">New</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Preferences (comma separated)</label>
                <input value={newCustomer.preferences} onChange={e => setNewCustomer({...newCustomer, preferences: e.target.value})} type="text" placeholder="perfume, kurta, saree"
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
              </div>
              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-border-color">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg font-medium text-[13px] text-text-muted hover:bg-slate-50">Cancel</button>
                <button type="submit" className="bg-brand-green hover:bg-brand-green-hover text-white px-5 py-2 rounded-lg font-medium text-[13px] shadow-sm">Add Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
