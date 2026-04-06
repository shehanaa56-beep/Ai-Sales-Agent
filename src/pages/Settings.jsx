import React, { useState, useEffect } from 'react';
import { Shield, Globe, Bell, Palette, User, Key, MessageSquare, Zap, Save, Loader2, CheckCircle2, AlertCircle, BookOpen, Sparkles } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useCompany } from '../context/CompanyContext';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('General');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    industry: '',
    whatsappToken: '',
    phoneNumberId: '',
    verifyToken: '',
    webhookUrl: '',
    groqKey: '',
    model: 'llama-3.3-70b-versatile',
    maxTokens: 1024,
    temperature: 0.5,
    firebaseProjectId: '',
    firebaseApiKey: '',
    firebaseAuthDomain: '',
    firebaseStorageBucket: '',
    n8nBaseUrl: '',
    n8nApiKey: '',
    rag_topK: 3,
    rag_threshold: 0.75,
    rag_chunkSize: 1000,
    rag_autoSync: true,
    darkMode: true,
    compactSidebar: false,
    notifyNewOrders: true,
    notifyEscalations: true,
    notifyLowStock: true,
    notifyFollowup: true,
    notifyDailySummary: false,
    notifyMarketing: false
  });

  const { activeCompanyId } = useCompany();

  useEffect(() => {
    if (!activeCompanyId) return;
    loadSettings();
  }, [activeCompanyId]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // 1. Load Business Profile from Company Doc
      const companyRef = doc(db, 'companies', activeCompanyId);
      const companySnap = await getDoc(companyRef);
      
      // 2. Load Integrations/Preferences from Config Sub-collection
      const configRef = doc(db, 'companies', activeCompanyId, 'configs', 'settings');
      const configSnap = await getDoc(configRef);

      if (companySnap.exists()) {
        const cData = companySnap.data();
        const sData = configSnap.exists() ? configSnap.data() : {};

        setFormData(prev => ({
          ...prev,
          businessName: cData.name || '',
          email: cData.email || '',
          phone: cData.whatsapp_number || '',
          industry: cData.industry || '',
          whatsappToken: sData.whatsappToken || '',
          phoneNumberId: sData.phoneNumberId || '',
          verifyToken: sData.verifyToken || '',
          webhookUrl: sData.webhookUrl || '',
          groqKey: sData.groqKey || sData.openaiKey || '',
          model: sData.model || 'llama-3.3-70b-versatile',
          ...sData
        }));
      }
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    try {
      // Update Company Profile
      const companyRef = doc(db, 'companies', activeCompanyId);
      await updateDoc(companyRef, {
        name: formData.businessName,
        email: formData.email,
        whatsapp_number: formData.phone,
        industry: formData.industry
      });

      // Update Sub-collection Configs
      const configRef = doc(db, 'companies', activeCompanyId, 'configs', 'settings');
      await setDoc(configRef, {
        whatsappToken: formData.whatsappToken,
        phoneNumberId: formData.phoneNumberId,
        verifyToken: formData.verifyToken,
        webhookUrl: formData.webhookUrl,
        groqKey: formData.groqKey,
        openaiKey: formData.groqKey, // Maintain backward compatibility
        model: formData.model,
        maxTokens: formData.maxTokens,
        temperature: formData.temperature,
        firebaseProjectId: formData.firebaseProjectId,
        firebaseApiKey: formData.firebaseApiKey,
        firebaseAuthDomain: formData.firebaseAuthDomain,
        firebaseStorageBucket: formData.firebaseStorageBucket,
        n8nBaseUrl: formData.n8nBaseUrl,
        n8nApiKey: formData.n8nApiKey,
        darkMode: formData.darkMode,
        compactSidebar: formData.compactSidebar,
        notifyNewOrders: formData.notifyNewOrders,
        notifyEscalations: formData.notifyEscalations,
        notifyLowStock: formData.notifyLowStock,
        notifyFollowup: formData.notifyFollowup,
        notifyDailySummary: formData.notifyDailySummary,
        notifyMarketing: formData.notifyMarketing,
        rag_topK: formData.rag_topK,
        rag_threshold: formData.rag_threshold,
        rag_chunkSize: formData.rag_chunkSize,
        rag_autoSync: formData.rag_autoSync
      }, { merge: true });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("Failed to save settings.");
    }
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordUpdate = async () => {
    if (!passwordData.newPassword || !passwordData.currentPassword) {
      setPasswordStatus({ type: 'error', message: 'Please fill in all fields.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    setPasswordStatus({ type: '', message: '' });

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user found.");

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, passwordData.newPassword);
      
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      console.error("Password update error:", err);
      let message = 'Failed to update password.';
      if (err.code === 'auth/wrong-password') {
        message = 'Incorrect current password.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/requires-recent-login') {
        message = 'Please logout and login again to change password.';
      }
      setPasswordStatus({ type: 'error', message: message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const tabs = ['General', 'Integrations', 'Notifications', 'Security'];

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-text-muted">
        <Loader2 className="animate-spin text-brand-green" size={40} />
        <p className="font-medium italic">Synchronizing business profile and configurations...</p>
    </div>
  )

  return (
    <div className="flex flex-col">
      {saved && (
        <div className="fixed top-6 right-6 bg-brand-green text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Save size={16} /> Settings saved successfully!
        </div>
      )}
      <div className="flex gap-2 mb-6 border-b border-border-color pb-0 overflow-x-auto hide-scrollbar scroll-smooth">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[14px] font-bold rounded-t-xl transition-all relative whitespace-nowrap ${
              activeTab === tab
                ? 'text-text-main bg-white shadow-[0_-1px_2px_rgba(0,0,0,0.02)] border border-border-color translate-y-[1px] z-10'
                : 'text-text-muted hover:text-text-main hover:bg-slate-50 border border-transparent border-b-0'
            }`}>{tab}</button>
        ))}
      </div>
      <div>
        {activeTab === 'General' && <GeneralTab formData={formData} onUpdate={handleUpdate} onSave={saveSettings} />}
        {activeTab === 'Integrations' && <IntegrationsTab formData={formData} onUpdate={handleUpdate} onSave={saveSettings} />}
        {activeTab === 'Notifications' && <NotificationsTab formData={formData} onUpdate={handleUpdate} onSave={saveSettings} />}
        {activeTab === 'Security' && (
          <SecurityTab 
            passwordData={passwordData} 
            passwordLoading={passwordLoading}
            passwordStatus={passwordStatus}
            setPasswordData={setPasswordData}
            onUpdatePassword={handlePasswordUpdate} 
          />
        )}
      </div>
    </div>
  );
};

const InputField = ({ label, type = 'text', value, onChange, placeholder, helpText }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[13px] font-medium text-text-main">{label}</label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green transition-all" />
    {helpText && <span className="text-[11px] text-text-muted">{helpText}</span>}
  </div>
);

const Toggle = ({ label, desc, on, onClick }) => (
  <div className="flex justify-between items-center">
    <div className="flex flex-col gap-0.5">
      <span className="text-[14px] font-medium text-text-main">{label}</span>
      <span className="text-[13px] text-text-muted">{desc}</span>
    </div>
    <div onClick={onClick} className={`w-11 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${on ? 'bg-brand-green justify-end' : 'bg-slate-200 justify-start'}`}>
      <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
    </div>
  </div>
);

const GeneralTab = ({ formData, onUpdate, onSave }) => (
  <div className="flex flex-col gap-6">
    <div className="bg-white rounded-xl border border-border-color p-8 shadow-sm">
      <div className="flex gap-4 items-start mb-6">
        <User className="text-text-muted w-5 h-5 mt-1" />
        <div>
          <h3 className="text-base font-semibold text-text-main m-0">Business Profile</h3>
          <p className="text-[13px] text-text-muted m-0 mt-0.5">Your business details and branding</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:ml-9">
        <InputField label="Business Name" value={formData.businessName} onChange={e => onUpdate('businessName', e.target.value)} />
        <InputField label="Email" type="email" value={formData.email} onChange={e => onUpdate('email', e.target.value)} />
        <InputField label="Phone" value={formData.phone} onChange={e => onUpdate('phone', e.target.value)} />
        <InputField label="Industry" value={formData.industry} onChange={e => onUpdate('industry', e.target.value)} />
      </div>
      <div className="flex justify-end mt-8">
        <button onClick={onSave} className="bg-brand-green hover:bg-brand-green-hover text-white px-5 py-2 rounded-lg font-medium text-[13px] shadow-sm transition-colors">Save Changes</button>
      </div>
    </div>

    <div className="bg-white rounded-xl border border-border-color p-8 shadow-sm">
      <div className="flex gap-4 items-start mb-6">
        <Palette className="text-text-muted w-5 h-5 mt-1" />
        <div>
          <h3 className="text-base font-semibold text-text-main m-0">Appearance</h3>
          <p className="text-[13px] text-text-muted m-0 mt-0.5">Customize the dashboard look</p>
        </div>
      </div>
      <div className="flex flex-col gap-5 md:ml-9">
        <Toggle label="Dark Mode" desc="Use dark theme for the dashboard" on={formData.darkMode} onClick={() => onUpdate('darkMode', !formData.darkMode)} />
        <Toggle label="Compact Sidebar" desc="Use icon-only sidebar by default" on={formData.compactSidebar} onClick={() => onUpdate('compactSidebar', !formData.compactSidebar)} />
      </div>
    </div>
  </div>
);

const IntegrationsTab = ({ formData, onUpdate, onSave }) => (
  <div className="flex flex-col gap-6">
    <div className="bg-white rounded-xl border border-border-color p-8 shadow-sm">
      <div className="flex gap-4 items-start mb-6">
        <MessageSquare className="text-green-600 w-5 h-5 mt-1" />
        <div>
          <h3 className="text-base font-semibold text-text-main m-0">Greentick WhatsApp API</h3>
          <p className="text-[13px] text-text-muted m-0 mt-0.5">Configure your WhatsApp integration via Greentick & n8n</p>
        </div>
        <span className={`ml-auto px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${formData.whatsappToken ? 'bg-brand-green text-white' : 'bg-slate-100 text-slate-400'}`}>
            {formData.whatsappToken ? 'Connected' : 'Not Configured'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:ml-9">
        <InputField label="Greentick API Key" type="password" value={formData.whatsappToken} onChange={e => onUpdate('whatsappToken', e.target.value)} placeholder="Enter your Greentick API Key..." />
        <InputField label="Instance ID" value={formData.phoneNumberId} onChange={e => onUpdate('phoneNumberId', e.target.value)} placeholder="e.g. 123456" />
        <InputField label="Webhook Verify Token" value={formData.verifyToken} onChange={e => onUpdate('verifyToken', e.target.value)} placeholder="my_verify_token" />
        <InputField label="n8n Webhook URL" value={formData.webhookUrl} onChange={e => onUpdate('webhookUrl', e.target.value)} placeholder="https://your-n8n-instance.com/..." />
      </div>
      <div className="flex justify-end mt-6">
        <button onClick={onSave} className="bg-brand-green hover:bg-brand-green-hover text-white px-5 py-2 rounded-lg font-medium text-[13px] shadow-sm">Save WhatsApp Config</button>
      </div>
    </div>

    <div className="bg-white rounded-xl border border-border-color p-8 shadow-sm">
      <div className="flex gap-4 items-start mb-6">
        <Zap className="text-violet-500 w-5 h-5 mt-1" />
        <div>
          <h3 className="text-base font-semibold text-text-main m-0">Groq AI Engine (RAG)</h3>
          <p className="text-[13px] text-text-muted m-0 mt-0.5">High-performance AI response generation & RAG</p>
        </div>
        <span className={`ml-auto px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${formData.groqKey ? 'bg-brand-green text-white' : 'bg-slate-100 text-slate-400'}`}>
            {formData.groqKey ? 'Connected' : 'Not Configured'}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:ml-9">
        <InputField label="Groq API Key" type="password" value={formData.groqKey} onChange={e => onUpdate('groqKey', e.target.value)} placeholder="gsk-..." />
        <InputField label="Groq Model" value={formData.model} onChange={e => onUpdate('model', e.target.value)} placeholder="llama-3.3-70b-versatile" helpText="Supports Llama 3, Mixtral, and more" />
        <InputField label="Max Tokens" type="number" value={formData.maxTokens} onChange={e => onUpdate('maxTokens', e.target.value)} />
        <InputField label="Temperature" type="number" value={formData.temperature} onChange={e => onUpdate('temperature', e.target.value)} />
      </div>
      <div className="flex justify-end mt-6">
        <button onClick={onSave} className="bg-brand-green hover:bg-brand-green-hover text-white px-5 py-2 rounded-lg font-medium text-[13px] shadow-sm">Save AI Config</button>
      </div>
    </div>

    {/* RAG Configuration Section */}
    <div className="bg-white rounded-xl border border-border-color p-8 shadow-sm">
      <div className="flex gap-4 items-start mb-6">
        <BookOpen className="text-blue-500 w-5 h-5 mt-1" />
        <div>
          <h3 className="text-base font-semibold text-text-main m-0">RAG Optimization</h3>
          <p className="text-[13px] text-text-muted m-0 mt-0.5">Fine-tune how AI retrieves and uses your knowledge base</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:ml-9">
        <div className="flex flex-col gap-5">
          <InputField 
            label="Retrieval Depth (Top-K)" 
            type="number" 
            value={formData.rag_topK} 
            onChange={e => onUpdate('rag_topK', parseInt(e.target.value))} 
            helpText="Number of knowledge snippets to provide for each query (Default: 3)"
          />
          <InputField 
            label="Similarity Threshold" 
            type="number" 
            step="0.05"
            min="0"
            max="1"
            value={formData.rag_threshold} 
            onChange={e => onUpdate('rag_threshold', parseFloat(e.target.value))} 
            helpText="Minimum confidence score for retrieval (Range 0-1)"
          />
        </div>
        <div className="flex flex-col gap-6 pt-2">
          <Toggle 
            label="Automatic Sync" 
            desc="Automatically re-index knowledge snippets when updated" 
            on={formData.rag_autoSync} 
            onClick={() => onUpdate('rag_autoSync', !formData.rag_autoSync)} 
          />
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex gap-2 items-center mb-1">
              <Sparkles className="text-blue-600 w-4 h-4" />
              <span className="text-[12px] font-bold text-blue-800 uppercase tracking-wider">RAG Insights</span>
            </div>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Higher <b>Retrieval Depth</b> provides more context but increases token usage. 
              A <b>Similarity Threshold</b> of 0.7-0.8 is recommended for precise sales assistants.
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <button onClick={onSave} className="bg-brand-green hover:bg-brand-green-hover text-white px-5 py-2 rounded-lg font-medium text-[13px] shadow-sm">Save RAG Parameters</button>
      </div>
    </div>
  </div>
);

const NotificationsTab = ({ formData, onUpdate, onSave }) => (
  <div className="bg-white rounded-xl border border-border-color p-8 shadow-sm">
    <div className="flex gap-4 items-start mb-8">
      <Bell className="text-text-muted w-5 h-5 mt-1" />
      <div>
        <h3 className="text-base font-semibold text-text-main m-0">Notification Preferences</h3>
        <p className="text-[13px] text-text-muted m-0 mt-0.5">Choose what alerts you receive</p>
      </div>
      <button onClick={onSave} className="ml-auto bg-brand-green hover:bg-brand-green-hover text-white px-4 py-2 rounded-lg font-medium text-[13px] shadow-sm">Save Preferences</button>
    </div>
    <div className="flex flex-col gap-5 md:ml-9">
      <Toggle label="New Orders" desc="Get notified for every new order" on={formData.notifyNewOrders} onClick={() => onUpdate('notifyNewOrders', !formData.notifyNewOrders)} />
      <Toggle label="AI Escalations" desc="When AI agent escalates to human" on={formData.notifyEscalations} onClick={() => onUpdate('notifyEscalations', !formData.notifyEscalations)} />
      <Toggle label="Low Stock Alerts" desc="Product inventory running low" on={formData.notifyLowStock} onClick={() => onUpdate('notifyLowStock', !formData.notifyLowStock)} />
      <Toggle label="Follow-up Sent" desc="Notification when automated follow-up is sent" on={formData.notifyFollowup} onClick={() => onUpdate('notifyFollowup', !formData.notifyFollowup)} />
      <Toggle label="Daily Summary" desc="Daily business performance digest" on={formData.notifyDailySummary} onClick={() => onUpdate('notifyDailySummary', !formData.notifyDailySummary)} />
      <Toggle label="Marketing Reports" desc="Weekly campaign performance" on={formData.notifyMarketing} onClick={() => onUpdate('notifyMarketing', !formData.notifyMarketing)} />
    </div>
  </div>
);

const SecurityTab = ({ passwordData, passwordLoading, passwordStatus, setPasswordData, onUpdatePassword }) => (
  <div className="bg-white rounded-xl border border-border-color p-8 shadow-sm">
    <div className="flex gap-4 items-start mb-8">
      <Shield className="text-text-muted w-5 h-5 mt-1" />
      <div>
        <h3 className="text-base font-semibold text-text-main m-0">Security Settings</h3>
        <p className="text-[13px] text-text-muted m-0 mt-0.5">Protect your account</p>
      </div>
    </div>
    <div className="flex flex-col gap-5 md:ml-9">
      <InputField 
        label="Current Password" 
        type="password" 
        value={passwordData.currentPassword}
        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <InputField 
          label="New Password" 
          type="password" 
          value={passwordData.newPassword}
          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
        />
        <InputField 
          label="Confirm Password" 
          type="password" 
          value={passwordData.confirmPassword}
          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
        />
      </div>

      {passwordStatus.message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-1 ${
          passwordStatus.type === 'success' 
            ? 'bg-status-active-bg text-status-active-text border border-status-active-text/10' 
            : 'bg-status-danger-bg text-status-danger-text border border-status-danger-text/10'
        }`}>
          {passwordStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {passwordStatus.message}
        </div>
      )}

      <div className="pt-4 border-t border-border-color">
        <Toggle label="Two-Factor Authentication" desc="Add an extra layer of security" on={false} />
      </div>
      <div className="flex justify-end mt-2">
        <button 
          onClick={onUpdatePassword} 
          disabled={passwordLoading}
          className="bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/50 text-white px-5 py-2 rounded-lg font-medium text-[13px] shadow-sm flex items-center gap-2 transition-all active:scale-[0.98]"
        >
          {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : null}
          Update Password
        </button>
      </div>
    </div>
  </div>
);

export default Settings;
