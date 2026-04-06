import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, X, BookOpen, Trash2, Edit2, 
  ChevronRight, Info, AlertCircle, Save, Sparkles 
} from 'lucide-react';
import { 
  collection, doc, getDocs, addDoc, updateDoc, 
  deleteDoc, query, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCompany } from '../context/CompanyContext';

const KnowledgeBase = () => {
  const [knowledge, setKnowledge] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { activeCompanyId } = useCompany();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  });

  useEffect(() => {
    loadKnowledge();
  }, [activeCompanyId]);

  const loadKnowledge = async () => {
    setLoading(true);
    try {
      // Access subcollection: companies/{companyId}/knowledge
      const knowledgeRef = collection(db, 'companies', activeCompanyId, 'knowledge');
      const snap = await getDocs(knowledgeRef);
      setKnowledge(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error loading knowledge:", err);
      // Fallback for demo
      setKnowledge([
        { 
          id: '1', 
          title: 'Official Gym Hours', 
          content: 'We are open 24/7 for premium members. For basic members, hours are 6 AM to 10 PM daily.', 
          tags: ['hours', 'timing', 'open'],
          updatedAt: new Date()
        },
        { 
          id: '2', 
          title: 'Cancellation Policy', 
          content: 'Memberships can be cancelled with a 30-day notice. Contact support-gym@example.com for processing.', 
          tags: ['cancel', 'refund', 'policy'],
          updatedAt: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tagsArr = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    
    const payload = {
      title: formData.title,
      content: formData.content,
      tags: tagsArr,
      updatedAt: serverTimestamp()
    };

    try {
      const knowledgeRef = collection(db, 'companies', activeCompanyId, 'knowledge');
      if (editingId) {
        await updateDoc(doc(db, 'companies', activeCompanyId, 'knowledge', editingId), payload);
      } else {
        await addDoc(knowledgeRef, { ...payload, createdAt: serverTimestamp() });
      }
      setShowModal(false);
      resetForm();
      loadKnowledge();
    } catch (err) {
      console.error("Error saving knowledge:", err);
      // Mock update for front-end only demo if firestore fails
      const mockResult = { id: editingId || Date.now().toString(), ...payload };
      if (editingId) {
        setKnowledge(knowledge.map(k => k.id === editingId ? mockResult : k));
      } else {
        setKnowledge([mockResult, ...knowledge]);
      }
      setShowModal(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', tags: '' });
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      tags: (item.tags || []).join(', ')
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this knowledge snippet?")) return;
    try {
      await deleteDoc(doc(db, 'companies', activeCompanyId, 'knowledge', id));
      setKnowledge(knowledge.filter(k => k.id !== id));
    } catch (err) {
      console.error("Error deleting knowledge:", err);
      setKnowledge(knowledge.filter(k => k.id !== id));
    }
  };

  const filtered = knowledge.filter(k => 
    k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 w-full max-w-lg bg-white rounded-xl border border-border-color px-4 py-2.5 flex items-center gap-3 shadow-sm focus-within:ring-2 focus-within:ring-brand-green/10 transition-all">
          <Search size={18} className="text-text-muted" />
          <input 
            type="text" 
            placeholder="Search FAQs, policies, or general knowledge..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border-none w-full text-sm outline-none placeholder:text-text-muted bg-transparent"
          />
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary shrink-0 flex items-center gap-2"
        >
          <Plus size={16} /> Add Snippet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-text-muted italic bg-white rounded-2xl border border-dashed border-border-color">
            Loading knowledge base...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-text-muted bg-white rounded-2xl border border-dashed border-border-color gap-3">
            <BookOpen size={40} className="text-slate-200" />
            <div className="text-center">
              <p className="font-semibold text-text-main">No knowledge items found</p>
              <p className="text-sm">Try a different search or add a new snippet.</p>
            </div>
          </div>
        ) : (
          filtered.map(item => (
            <div 
              key={item.id} 
              className="bg-white rounded-2xl border border-border-color shadow-sm hover:shadow-lg transition-all group flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green">
                      <BookOpen size={16} />
                    </div>
                    <h3 className="text-[15px] font-bold text-text-main line-clamp-1">{item.title}</h3>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(item)} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 hover:bg-red-50 rounded-md text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-[13px] text-text-muted leading-relaxed line-clamp-3 mb-4">
                  {item.content}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(item.tags || []).map((tag, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/50 flex justify-between items-center rounded-b-2xl">
                <span className="text-[10px] text-slate-400 font-medium">
                  Last updated {item.updatedAt?.toDate ? item.updatedAt.toDate().toLocaleDateString() : 'Just now'}
                </span>
                <ChevronRight size={14} className="text-slate-300" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
        <Info size={20} className="shrink-0" />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold">RAG Tips</span>
          <span className="text-[13px] opacity-90">Your AI Agent uses these snippets and your product catalog to answer questions. Make sure to keep your cancellation policies, shipping times, and business hours updated!</span>
        </div>
      </div>

      {/* Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-border-color flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                <Sparkles size={18} className="text-brand-green" />
                {editingId ? 'Edit Knowledge Snippet' : 'Add Knowledge Snippet'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider">Snippet Title</label>
                <input 
                  required 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  type="text" 
                  placeholder="e.g. Return Policy, Store Hours"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-border-color rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider">Detailed Content</label>
                <textarea 
                  required 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})} 
                  rows={5} 
                  placeholder="Explain exactly what the AI needs to know..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-border-color rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-bold text-text-muted uppercase tracking-wider">Search Keywords (Tags)</label>
                <input 
                  value={formData.tags} 
                  onChange={e => setFormData({...formData, tags: e.target.value})} 
                  type="text" 
                  placeholder="hours, support, refund (comma separated)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-border-color rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all"
                />
                <span className="text-[11px] text-text-muted italic">Tags help the AI pick the right information during a conversation.</span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border-color mt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-5 py-2.5 rounded-xl font-bold text-sm text-text-muted hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-brand-green hover:bg-brand-green-hover text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-brand-green/20 transition-all flex items-center gap-2 active:scale-95"
                >
                  <Save size={16} />
                  {editingId ? 'Update Snippet' : 'Save Snippet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
