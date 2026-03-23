import React, { useState } from 'react';
import { Shield, Globe, Bell, Palette, User, Key } from 'lucide-react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('General');

  const tabs = ['General', 'Notifications', 'Integrations', 'Security'];

  const renderContent = () => {
    switch(activeTab) {
      case 'General': return <GeneralTab />;
      case 'Notifications': return <NotificationsTab />;
      case 'Integrations': return <IntegrationsTab />;
      case 'Security': return <SecurityTab />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex space-x-2 mb-6 border-b border-border-color pb-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-[15px] font-medium rounded-t-lg transition-colors relative ${
              activeTab === tab 
                ? 'text-text-main bg-white shadow-[0_-1px_2px_rgba(0,0,0,0.02)] border border-b-0 border-border-color translate-y-[1px] z-10' 
                : 'text-text-muted hover:text-text-main hover:bg-slate-50 border border-transparent border-b-0'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>
        {renderContent()}
      </div>
    </div>
  );
};

const GeneralTab = () => (
  <div className="flex flex-col gap-6">
    <div className="bg-white rounded-lg border border-border-color p-8 shadow-sm">
      <div className="flex gap-4 items-start mb-6">
        <User className="text-text-muted w-5 h-5 mt-1" />
        <div>
          <h3 className="text-base font-semibold text-text-main m-0">Business Profile</h3>
          <p className="text-[13px] text-text-muted m-0 mt-0.5">Your business details and branding</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-9">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-text-main">Business Name</label>
          <input type="text" defaultValue="AI Sales Agent" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-shadow" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-text-main">Email</label>
          <input type="email" defaultValue="admin@aisalesagent.com" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-shadow" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-text-main">Phone</label>
          <input type="text" defaultValue="+91 98765 43210" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-shadow" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-text-main">Industry</label>
          <input type="text" defaultValue="E-commerce" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-shadow" />
        </div>
      </div>
      <div className="flex justify-end mt-8">
        <button className="bg-brand-green hover:bg-brand-green-hover transition-colors text-white px-5 py-2 rounded-md font-medium text-[13px] shadow-sm">Save Changes</button>
      </div>
    </div>

    <div className="bg-white rounded-lg border border-border-color p-8 shadow-sm">
      <div className="flex gap-4 items-start mb-6">
        <Palette className="text-text-muted w-5 h-5 mt-1" />
        <div>
          <h3 className="text-base font-semibold text-text-main m-0">Appearance</h3>
          <p className="text-[13px] text-text-muted m-0 mt-0.5">Customize the dashboard look</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-6 ml-9">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[14px] font-medium text-text-main">Dark Mode</span>
            <span className="text-[13px] text-text-muted">Use dark theme for the dashboard</span>
          </div>
          <div className="w-11 h-6 rounded-full bg-brand-green flex items-center justify-end p-0.5 cursor-pointer">
            <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[14px] font-medium text-text-main">Compact Sidebar</span>
            <span className="text-[13px] text-text-muted">Use icon-only sidebar by default</span>
          </div>
          <div className="w-11 h-6 rounded-full bg-slate-200 flex items-center justify-start p-0.5 cursor-pointer">
            <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const NotificationsTab = () => (
  <div className="bg-white rounded-lg border border-border-color p-8 shadow-sm">
    <div className="flex gap-4 items-start mb-8">
      <Bell className="text-text-muted w-5 h-5 mt-1" />
      <div>
        <h3 className="text-base font-semibold text-text-main m-0">Notification Preferences</h3>
        <p className="text-[13px] text-text-muted m-0 mt-0.5">Choose what alerts you receive</p>
      </div>
    </div>
    
    <div className="flex flex-col gap-6 ml-9">
      {[
        { title: 'New Orders', desc: 'Get notified for every new order', on: true },
        { title: 'AI Escalations', desc: 'When AI agent escalates to human', on: true },
        { title: 'Low Stock Alerts', desc: 'Product inventory running low', on: true },
        { title: 'Daily Summary', desc: 'Daily business performance digest', on: false },
        { title: 'Marketing Reports', desc: 'Weekly campaign performance', on: false },
      ].map((item, i) => (
        <div key={i} className="flex justify-between items-center">
          <div className="flex flex-col gap-0.5">
            <span className="text-[14px] font-medium text-text-main">{item.title}</span>
            <span className="text-[13px] text-text-muted">{item.desc}</span>
          </div>
          <div className={`w-11 h-6 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${item.on ? 'bg-brand-green justify-end' : 'bg-slate-200 justify-start'}`}>
            <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const IntegrationsTab = () => (
  <div className="flex flex-col gap-6">
    <div className="bg-white rounded-lg border border-border-color p-8 shadow-sm">
      <div className="flex gap-4 items-start mb-8">
        <Globe className="text-text-muted w-5 h-5 mt-1" />
        <div>
          <h3 className="text-base font-semibold text-text-main m-0">Connected Services</h3>
          <p className="text-[13px] text-text-muted m-0 mt-0.5">Manage your third-party integrations</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-6 ml-9">
        {[
          { name: 'WhatsApp Cloud API', connected: true },
          { name: 'OpenAI (GPT)', connected: true },
          { name: 'Firebase', connected: true },
          { name: 'Razorpay', connected: false },
          { name: 'n8n Workflows', connected: false },
        ].map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <span className="text-[14px] font-medium text-text-main">{item.name}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex w-fit ${item.connected ? 'bg-brand-green text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                {item.connected ? 'Connected' : 'Not configured'}
              </span>
            </div>
            <button className={`px-4 py-2 rounded-md font-medium text-[13px] transition-colors ${item.connected ? 'bg-white border border-border-color text-text-main hover:bg-slate-50 shadow-sm' : 'bg-brand-green text-white hover:bg-brand-green-hover shadow-sm'}`}>
              {item.connected ? 'Configure' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-white rounded-lg border border-border-color p-8 shadow-sm">
      <div className="flex gap-4 items-start mb-8">
        <Key className="text-text-muted w-5 h-5 mt-1" />
        <div>
          <h3 className="text-base font-semibold text-text-main m-0">API Keys</h3>
          <p className="text-[13px] text-text-muted m-0 mt-0.5">Manage your API credentials</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-6 ml-9">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-text-main">OpenAI API Key</label>
          <input type="password" defaultValue="sk-1234567890abcdefghijklmnopqrstuvwxyz" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-shadow text-slate-500" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-text-main">WhatsApp Token</label>
          <input type="password" defaultValue="EAABabc1234567890" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-shadow text-slate-500" />
        </div>
        <div className="flex justify-end mt-2">
          <button className="bg-brand-green hover:bg-brand-green-hover transition-colors text-white px-5 py-2 rounded-md font-medium text-[13px] shadow-sm">Update Keys</button>
        </div>
      </div>
    </div>
  </div>
);

const SecurityTab = () => (
  <div className="bg-white rounded-lg border border-border-color p-8 shadow-sm">
    <div className="flex gap-4 items-start mb-8">
      <Shield className="text-text-muted w-5 h-5 mt-1" />
      <div>
        <h3 className="text-base font-semibold text-text-main m-0">Security Settings</h3>
        <p className="text-[13px] text-text-muted m-0 mt-0.5">Protect your account</p>
      </div>
    </div>

    <div className="flex flex-col gap-6 ml-9">
      <div className="flex flex-col gap-2">
        <label className="text-[13px] font-medium text-text-main">Current Password</label>
        <input type="password" defaultValue="password123" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-shadow text-slate-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-text-main">New Password</label>
          <input type="password" defaultValue="password123" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-shadow text-slate-500" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-text-main">Confirm Password</label>
          <input type="password" defaultValue="password123" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green transition-shadow text-slate-500" />
        </div>
      </div>

      <div className="flex justify-between items-center py-6 border-y border-border-color mt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-medium text-text-main">Two-Factor Authentication</span>
          <span className="text-[13px] text-text-muted">Add an extra layer of security</span>
        </div>
        <div className="w-11 h-6 rounded-full bg-slate-200 flex items-center justify-start p-0.5 cursor-pointer">
          <div className="w-5 h-5 bg-white rounded-full shadow-sm"></div>
        </div>
      </div>
      
      <div className="flex justify-end mt-2">
        <button className="bg-brand-green hover:bg-brand-green-hover transition-colors text-white px-5 py-2 rounded-md font-medium text-[13px] shadow-sm">Update Password</button>
      </div>
    </div>
  </div>
);

export default Settings;
