import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, X, BookOpen, Trash2, Edit2, 
  ChevronRight, Info, AlertCircle, Save, Sparkles,
  Upload, FileText, File, CheckCircle, Loader2
} from 'lucide-react';
import { 
  collection, doc, getDocs, addDoc, updateDoc, 
  deleteDoc, query, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCompany } from '../context/CompanyContext';

/**
 * Parse a TXT file and return its text content.
 */
async function parseTxtFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

/**
 * Parse a PDF file using pdfjs-dist and return all text content.
 */
async function parsePdfFile(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText.trim();
}

/**
 * Split long text into chunks of ~1500 chars, respecting paragraph boundaries.
 */
function chunkText(text, maxChars = 1500) {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    if ((current + '\n\n' + trimmed).length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = trimmed;
    } else {
      current = current ? current + '\n\n' + trimmed : trimmed;
    }
  }
  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [text.trim()];
}

const KnowledgeBase = () => {
  const [knowledge, setKnowledge] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadState, setUploadState] = useState('idle'); // idle | parsing | saving | done | error
  const [uploadInfo, setUploadInfo] = useState(null); // { fileName, fileSize, chunks, savedCount }
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
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
      const knowledgeRef = collection(db, 'companies', activeCompanyId, 'knowledge');
      const snap = await getDocs(knowledgeRef);
      setKnowledge(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error loading knowledge:", err);
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

  // ===== FILE UPLOAD LOGIC =====
  const handleFileSelect = async (file) => {
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['txt', 'pdf'].includes(ext)) {
      alert('Only .txt and .pdf files are supported.');
      return;
    }

    setUploadState('parsing');
    setUploadInfo({ fileName: file.name, fileSize: (file.size / 1024).toFixed(1), chunks: 0, savedCount: 0 });

    try {
      // 1. Parse file
      let text = '';
      if (ext === 'txt') {
        text = await parseTxtFile(file);
      } else if (ext === 'pdf') {
        text = await parsePdfFile(file);
      }

      if (!text || text.trim().length < 10) {
        setUploadState('error');
        setUploadInfo(prev => ({ ...prev, errorMsg: 'File appears to be empty or unreadable.' }));
        return;
      }

      // 2. Chunk the text
      const chunks = chunkText(text);
      const baseName = file.name.replace(/\.(txt|pdf)$/i, '');
      setUploadInfo(prev => ({ ...prev, chunks: chunks.length }));
      setUploadState('saving');

      // 3. Save each chunk as a knowledge snippet
      const knowledgeRef = collection(db, 'companies', activeCompanyId, 'knowledge');
      let savedCount = 0;
      for (let i = 0; i < chunks.length; i++) {
        const title = chunks.length === 1 ? baseName : `${baseName} (Part ${i + 1})`;
        // Extract some keywords from the first 200 chars as auto-tags
        const words = chunks[i].substring(0, 200).split(/\s+/).filter(w => w.length > 4).slice(0, 5).map(w => w.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const uniqueTags = [...new Set(words)];

        await addDoc(knowledgeRef, {
          title,
          content: chunks[i],
          tags: uniqueTags,
          source: 'file_upload',
          sourceFile: file.name,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        savedCount++;
        setUploadInfo(prev => ({ ...prev, savedCount }));
      }

      setUploadState('done');
      // Reload the knowledge list after a brief pause
      setTimeout(() => {
        loadKnowledge();
      }, 1000);
    } catch (err) {
      console.error("Error processing file:", err);
      setUploadState('error');
      setUploadInfo(prev => ({ ...prev, errorMsg: err.message || 'Failed to process file.' }));
    }
  };

  const resetUpload = () => {
    setUploadState('idle');
    setUploadInfo(null);
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
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
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={() => { resetUpload(); setShowUploadModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border-color rounded-xl text-sm font-bold text-text-main hover:bg-slate-50 hover:border-brand-green/30 transition-all shadow-sm"
          >
            <Upload size={16} className="text-brand-green" /> Upload File
          </button>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary shrink-0 flex items-center gap-2"
          >
            <Plus size={16} /> Add Snippet
          </button>
        </div>
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
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.source === 'file_upload' ? 'bg-violet-50 text-violet-500' : 'bg-brand-green/10 text-brand-green'}`}>
                      {item.source === 'file_upload' ? <FileText size={16} /> : <BookOpen size={16} />}
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-text-main line-clamp-1">{item.title}</h3>
                      {item.sourceFile && (
                        <span className="text-[10px] text-violet-500 font-bold uppercase tracking-wider">
                          From: {item.sourceFile}
                        </span>
                      )}
                    </div>
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
          <span className="text-[13px] opacity-90">Your AI Agent uses these snippets and your product catalog to answer questions. You can now upload PDF or TXT files to quickly add detailed information!</span>
        </div>
      </div>

      {/* Snippet Modal */}
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

      {/* File Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-border-color flex justify-between items-center bg-slate-50">
              <h2 className="text-base font-bold text-text-main flex items-center gap-2">
                <Upload size={18} className="text-brand-green" />
                Upload Knowledge File
              </h2>
              <button onClick={() => { setShowUploadModal(false); resetUpload(); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              {/* Idle State: Drop Zone */}
              {uploadState === 'idle' && (
                <>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                      dragOver 
                        ? 'border-brand-green bg-brand-green/5 scale-[1.01]' 
                        : 'border-slate-200 hover:border-brand-green/40 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                      dragOver ? 'bg-brand-green/10 text-brand-green' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Upload size={28} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-text-main">
                        {dragOver ? 'Drop your file here!' : 'Drag & drop a file here'}
                      </p>
                      <p className="text-xs text-text-muted mt-1">or click to browse</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="px-2.5 py-1 bg-violet-50 text-violet-600 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
                        <FileText size={12} /> PDF
                      </span>
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
                        <File size={12} /> TXT
                      </span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                    />
                  </div>
                  <p className="text-[11px] text-text-muted text-center italic">
                    Upload clinic brochures, service lists, policies, or any document. The AI will learn from it instantly.
                  </p>
                </>
              )}

              {/* Parsing State */}
              {uploadState === 'parsing' && uploadInfo && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <Loader2 size={28} className="text-amber-500 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-text-main">Reading "{uploadInfo.fileName}"...</p>
                    <p className="text-xs text-text-muted mt-1">{uploadInfo.fileSize} KB</p>
                  </div>
                </div>
              )}

              {/* Saving State */}
              {uploadState === 'saving' && uploadInfo && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <Loader2 size={28} className="text-blue-500 animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-text-main">Saving to Knowledge Base...</p>
                    <p className="text-xs text-text-muted mt-1">
                      {uploadInfo.savedCount} of {uploadInfo.chunks} snippet{uploadInfo.chunks > 1 ? 's' : ''} saved
                    </p>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-brand-green rounded-full transition-all duration-300"
                      style={{ width: `${uploadInfo.chunks > 0 ? (uploadInfo.savedCount / uploadInfo.chunks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Done State */}
              {uploadState === 'done' && uploadInfo && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle size={28} className="text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-text-main">Upload Complete!</p>
                    <p className="text-xs text-text-muted mt-1">
                      Created {uploadInfo.savedCount} knowledge snippet{uploadInfo.savedCount > 1 ? 's' : ''} from "{uploadInfo.fileName}"
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowUploadModal(false); resetUpload(); }}
                    className="bg-brand-green hover:bg-brand-green-hover text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-brand-green/20 transition-all active:scale-95 mt-2"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Error State */}
              {uploadState === 'error' && uploadInfo && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                    <AlertCircle size={28} className="text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-text-main">Upload Failed</p>
                    <p className="text-xs text-red-500 mt-1">{uploadInfo.errorMsg || 'Something went wrong. Please try again.'}</p>
                  </div>
                  <button
                    onClick={resetUpload}
                    className="px-6 py-2.5 rounded-xl font-bold text-sm text-text-muted hover:bg-slate-100 transition-colors mt-2"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
