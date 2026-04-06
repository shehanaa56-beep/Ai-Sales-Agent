import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCompany } from '../context/CompanyContext';
import { TrendingUp, ShoppingCart, Users, Bot, MessageSquare } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, BarChart, Bar 
} from 'recharts';

const COLORS = ['#10a37f', '#0ea5e9', '#8b5cf6', '#f59e0b'];

const Analytics = () => {
  const [metrics, setMetrics] = useState({
    revenue: 0,
    orders: 0,
    leads: 0,
    convRate: '0%'
  });
  const [loading, setLoading] = useState(true);
  const { activeCompanyId } = useCompany();

  useEffect(() => {
    loadAnalytics();
  }, [activeCompanyId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders and Revenue
      const ordQuery = query(collection(db, 'orders'), where('companyId', '==', activeCompanyId));
      const ordSnap = await getDocs(ordQuery);
      const orders = ordSnap.docs.map(d => d.data());
      const totalRev = orders.reduce((sum, o) => sum + (o.total_spent || o.amount || 0), 0);

      // 2. Fetch Leads
      const leadQuery = query(collection(db, 'leads'), where('companyId', '==', activeCompanyId));
      const leadSnap = await getDocs(leadQuery);
      const totalLeads = leadSnap.size;

      // 3. Calculate conversion
      const conversion = totalLeads > 0 ? ((orders.length / totalLeads) * 100).toFixed(1) + '%' : '0%';

      setMetrics({
        revenue: totalRev,
        orders: orders.length,
        leads: totalLeads,
        convRate: conversion
      });
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Static demo patterns for charts
  const revData = [
    { name: 'Jan', value: (metrics.revenue * 0.1) || 4000 }, { name: 'Feb', value: (metrics.revenue * 0.15) || 5500 }, 
    { name: 'Mar', value: (metrics.revenue * 0.2) || 7200 }, { name: 'Apr', value: (metrics.revenue * 0.18) || 6800 }, 
    { name: 'May', value: (metrics.revenue * 0.22) || 9100 }, { name: 'Jun', value: (metrics.revenue * 0.15) || 5500 }
  ];

  const channelData = [
    { name: 'WhatsApp', value: 65 },
    { name: 'Web Chat', value: 25 },
    { name: 'Direct', value: 10 }
  ];

  const responseData = [
    { name: 'Mon', ai: 85, manual: 15 },
    { name: 'Tue', ai: 88, manual: 12 },
    { name: 'Wed', ai: 92, manual: 8 },
    { name: 'Thu', ai: 90, manual: 10 },
    { name: 'Fri', ai: 94, manual: 6 }
  ];

  const perfData = [
    { name: 'Sales Agent', resolved: 142, escalated: 12 },
    { name: 'Support', resolved: 98, escalated: 8 },
    { name: 'Marketing', resolved: 54, escalated: 5 },
  ];
  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: 'TOTAL REVENUE', value: `₹${metrics.revenue.toLocaleString('en-IN')}`, trend: '+12.5% vs last week', icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
          { title: 'TOTAL ORDERS', value: metrics.orders.toString(), trend: '+8.2% vs last week', icon: ShoppingCart, color: 'from-blue-500 to-indigo-600' },
          { title: 'ACTIVE LEADS', value: metrics.leads.toString(), trend: '+3.1% vs last week', icon: Users, color: 'from-violet-500 to-purple-600' },
          { title: 'CONVERSION RATE', value: metrics.convRate, trend: '+2.1% vs last week', icon: Bot, color: 'from-amber-500 to-orange-600' }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-border-color p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[13px] uppercase tracking-wide text-text-muted font-semibold">{item.title}</span>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-sm`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-text-main mb-2">{item.value}</div>
              <div className="text-[13px] font-medium text-status-active-text">{item.trend}</div>
            </div>
          );
        })}
      </div>

      {/* Revenue + Channel Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl border border-border-color p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-text-main">Revenue Trend</span>
            <span className="text-xs text-text-muted bg-slate-50 px-3 py-1 rounded-full">Last 6 Months</span>
          </div>
          <div className="w-full h-[280px]">
            <ResponsiveContainer>
              <AreaChart data={revData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10a37f" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10a37f" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="value" stroke="#10a37f" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="xl:col-span-1 bg-white rounded-xl border border-border-color p-6 shadow-sm">
          <div className="text-sm font-semibold text-text-main mb-4">Channel Distribution</div>
          <div className="w-full h-[200px] flex justify-center">
            <PieChart width={220} height={200}>
              <Pie data={channelData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                {channelData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {channelData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-text-muted">
                <div style={{backgroundColor: COLORS[index]}} className="w-2.5 h-2.5 rounded-full"></div>
                {entry.name} ({entry.value}%)
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Response Rate + Agent Performance */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border-color p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-main mb-4">
            <MessageSquare size={16} className="text-brand-green" /> AI vs Manual Response Rate
          </div>
          <div className="w-full h-[260px]">
            <ResponsiveContainer>
              <LineChart data={responseData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Line type="monotone" dataKey="ai" stroke="#10a37f" strokeWidth={2.5} dot={{ r: 4, fill: '#10a37f' }} name="AI Response %" />
                <Line type="monotone" dataKey="manual" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#ef4444' }} name="Manual %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border-color p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-main mb-4">
            <Bot size={16} className="text-brand-green" /> AI Agent Performance
          </div>
          <div className="w-full h-[260px]">
            <ResponsiveContainer>
              <BarChart data={perfData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="resolved" fill="#10a37f" radius={[4, 4, 0, 0]} maxBarSize={50} name="Resolved" />
                <Bar dataKey="escalated" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} name="Escalated" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
