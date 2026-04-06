import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, Trash2, Edit2, 
  ExternalLink, Globe, Key, Phone, CheckCircle, 
  SwitchCamera, MapPin, X, Save, MessageSquare, Zap
} from 'lucide-react';
import { 
  collection, getDocs, addDoc, updateDoc, 
  deleteDoc, doc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCompany } from '../context/CompanyContext';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { activeCompanyId, setActiveCompanyId } = useCompany();

  const [formData, setFormData] = useState({
    name: '',
    whatsapp_number: '',
    api_key: '',
    api_url: 'https://api.aoc-portal.com/v1/whatsapp',
    phone_number_id: '',
    system_prompt: 'You are a helpful sales assistant for a WhatsApp based AI sales agent.'
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'companies'));
      setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error loading companies:", err);
      // Mock for demo
      setCompanies([
        { id: 'company_test_001', name: 'Gym Pro Fitness', whatsapp_number: '919633859929', api_url: 'https://api.aoc-portal.com/v1/whatsapp', status: 'Active' },
        { id: 'company_test_002', name: 'Yoga Bliss Studio', whatsapp_number: '919037258541', api_url: 'https://api.aoc-portal.com/v1/whatsapp', status: 'Active' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, 'companies', editingId), payload);
      } else {
        await addDoc(collection(db, 'companies'), { ...payload, createdAt: serverTimestamp() });
      }
      setShowModal(false);
      resetForm();
      loadCompanies();
    } catch (err) {
      console.error("Error saving company:", err);
      setShowModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      whatsapp_number: '', 
      api_key: '', 
      api_url: 'https://api.aoc-portal.com/v1/whatsapp', 
      phone_number_id: '',
      system_prompt: 'You are a helpful sales assistant for a WhatsApp based AI sales agent.'
    });
    setEditingId(null);
  };

  const handleEdit = (company) => {
    setEditingId(company.id);
    setFormData({
      name: company.name || '',
      whatsapp_number: company.whatsapp_number || '',
      api_key: company.api_key || '',
      api_url: company.api_url || 'https://api.aoc-portal.com/v1/whatsapp',
      phone_number_id: company.phone_number_id || '',
      system_prompt: company.system_prompt || 'You are a helpful sales assistant for a WhatsApp based AI sales agent.'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this company? This is permanent.")) return;
    try {
      await deleteDoc(doc(db, 'companies', id));
      setCompanies(companies.filter(c => c.id !== id));
    } catch (err) {
      console.error("Error deleting company:", err);
    }
  };

  const filtered = companies.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.whatsapp_number || '').includes(searchTerm)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full lg:max-w-lg bg-white rounded-xl border border-border-color px-4 py-2.5 flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-brand-green/10 transition-all">
          <Search size={18} className="text-text-muted" />
          <input 
            type="text" 
            placeholder="Search companies..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border-none w-full text-sm outline-none placeholder:text-text-muted bg-transparent"
          />
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary w-full sm:w-auto justify-center flex items-center gap-2"
        >
          <Plus size={16} /> Add New Company
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-text-muted italic bg-white rounded-2xl border border-dashed border-border-color">
            Fetching clients...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-text-muted bg-white rounded-2xl border border-dashed border-border-color gap-3">
            <Building2 size={40} className="text-slate-200" />
            <div className="text-center">
              <p className="font-semibold text-text-main">No companies found</p>
              <p className="text-sm">Start by onboarding your first corporate client.</p>
            </div>
          </div>
        ) : (
          filtered.map(company => (
            <div 
              key={company.id} 
              className={`bg-white rounded-2xl border transition-all p-6 group ${
                activeCompanyId === company.id 
                  ? 'border-brand-green ring-2 ring-brand-green/10 shadow-md' 
                  : 'border-border-color shadow-sm hover:shadow-lg hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm shrink-0 ${
                    activeCompanyId === company.id 
                      ? 'bg-brand-green text-white' 
                      : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                  }`}>
                    {(company.name || '?')[0]}
                  </div>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2">
                       <h3 className="text-base font-bold text-text-main truncate">{company.name}</h3>
                       {activeCompanyId === company.id && (
                         <span className="flex items-center gap-1 bg-brand-green-light text-brand-green text-[10px] uppercase font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                           <CheckCircle size={10} /> Active Tenant
                         </span>
                       )}
                    </div>
                    <span className="text-[13px] text-text-muted flex items-center gap-1.5">
                      <Phone size={12} /> {company.whatsapp_number}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400 px-2.5 py-0.5 bg-slate-50 rounded-full border border-slate-100 mt-1 self-start font-mono">
                      ID: {company.id}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto sm:justify-end">
                  {activeCompanyId !== company.id ? (
                    <button 
                      onClick={() => setActiveCompanyId(company.id)}
                      className="w-full sm:w-auto px-4 py-2 bg-slate-900 border border-slate-900 text-white rounded-xl text-[13px] font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                      <SwitchCamera size={14} /> Connect
                    </button>
                  ) : (
                    <div className="flex gap-1 ml-auto sm:ml-0">
                      <button onClick={() => handleEdit(company)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(company.id)} className="p-2 hover:bg-red-50 rounded-xl text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-1 border-t border-dashed border-border-color pt-5">
                <div className="flex flex-col gap-1 overflow-hidden">
                  <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider">Bot API Endpoint</span>
                  <span className="text-[12px] font-medium text-text-main truncate">{company.api_url}</span>
                </div>
                <div className="flex flex-col gap-1 overflow-hidden">
                  <span className="text-[11px] text-text-muted font-bold uppercase tracking-wider">API Security</span>
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-text-main">
                    <Key size={12} className="text-amber-500" />
                    <span className="truncate">••••••••••{company.api_key?.slice(-4)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-border-color flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-3">
                <Building2 size={24} className="text-brand-green" />
                {editingId ? 'Update Company Details' : 'Onboard New Company'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-white rounded-xl shadow-sm">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 sm:p-8 flex flex-col gap-5 sm:gap-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Business Name</label>
                  <input 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    type="text" 
                    placeholder="e.g. Acme Corporation"
                    className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-border-color rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">WhatsApp Number</label>
                  <input 
                    required 
                    value={formData.whatsapp_number} 
                    onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} 
                    type="text" 
                    placeholder="e.g. 919876543210"
                    className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-border-color rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all"
                  />
                </div>
              </div>

              {/* API Integration */}
              <div className="flex flex-col gap-5 pt-4 border-t border-border-color">
                <div className="flex items-center gap-2 text-brand-green font-bold text-[12px] uppercase tracking-wide">
                  <Zap size={15} /> Bot API Configuration
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">API Key</label>
                  <input 
                    required 
                    value={formData.api_key} 
                    onChange={e => setFormData({...formData, api_key: e.target.value})} 
                    type="password" 
                    placeholder="Enter your AOC API key..."
                    className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-border-color rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all font-mono"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Bot API URL</label>
                  <input 
                    required 
                    value={formData.api_url} 
                    onChange={e => setFormData({...formData, api_url: e.target.value})} 
                    type="text" 
                    placeholder="e.g. https://api.aoc-portal.com/v1/whatsapp"
                    className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-border-color rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Phone Number ID</label>
                  <input 
                    value={formData.phone_number_id} 
                    onChange={e => setFormData({...formData, phone_number_id: e.target.value})} 
                    type="text" 
                    placeholder="Internal reference ID"
                    className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-border-color rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2 pt-4 border-t border-border-color">
                 <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">AI System Prompt</label>
                 <textarea 
                   rows={3}
                   value={formData.system_prompt} 
                   onChange={e => setFormData({...formData, system_prompt: e.target.value})} 
                   className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-border-color rounded-2xl text-sm outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all resize-none text-[13px]"
                 />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-border-color">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm text-text-muted hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-full sm:w-auto bg-brand-green hover:bg-brand-green-hover text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-brand-green/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {editingId ? 'Update' : 'Add Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
