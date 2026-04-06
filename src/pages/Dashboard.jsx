import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCompany } from '../context/CompanyContext';
import { DollarSign, ShoppingCart, Users, MessageSquare, TrendingUp, Bot, Zap, Clock, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    revenue: '₹0', orders: '0', customers: '0', conversations: '0',
    revTrend: '+0%', ordTrend: '+0%', custTrend: '+0%', convTrend: '+0%'
  });
  const [revenueData, setRevenueData] = useState([]);
  const [agentData, setAgentData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const { activeCompanyId } = useCompany();

  useEffect(() => {
    loadDashboard();
  }, [activeCompanyId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // 1. Load customers (leads) count for this company
      const custQuery = query(collection(db, 'leads'), where('companyId', '==', activeCompanyId));
      const custSnap = await getDocs(custQuery);
      const custCount = custSnap.size;

      // 2. Load orders for this company
      const ordQuery = query(collection(db, 'orders'), where('companyId', '==', activeCompanyId));
      const ordSnap = await getDocs(ordQuery);
      const orders = ordSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

      // 3. Load conversations for this company
      const convQuery = query(collection(db, 'conversations'), where('companyId', '==', activeCompanyId), limit(20));
      const convSnap = await getDocs(convQuery);
      const convCount = convSnap.size;

      // 4. Load pending followups for this company
      const followQuery = query(
        collection(db, 'followups'),
        where('companyId', '==', activeCompanyId),
        where('status', '==', 'pending')
      );
      const followSnap = await getDocs(followQuery);

      setStats({
        revenue: `₹${totalRevenue.toLocaleString('en-IN')}`,
        orders: orders.length.toString(),
        customers: custCount.toString(),
        conversations: convCount.toString(),
        revTrend: '0%',
        ordTrend: '0%',
        custTrend: '0%',
        convTrend: '0%'
      });

      // Recent orders (last 5)
      const sorted = orders.sort((a, b) => (b.purchase_date || '').localeCompare(a.purchase_date || '')).slice(0, 5);
      setRecentOrders(sorted.map(o => ({
        id: o.order_id || o.id,
        customer: o.customer_phone || 'Unknown',
        amount: `₹${(o.amount || 0).toLocaleString('en-IN')}`,
        product: o.product || 'N/A',
        status: o.status || 'Processing'
      })));

      // Activity feed from conversations
      const convs = convSnap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 6);
      setRecentActivity(convs.map(m => ({
        phone: m.phone || 'Unknown',
        message: m.inbound || '',
        reply: m.outbound || '',
        time: m.timestamp?.toDate ? m.timestamp.toDate().toLocaleTimeString() : 'Recent'
      })));

    } catch (err) {
      console.error('Error loading dashboard:', err);
      // Neutral fallback if query fails (e.g. while building index)
      setStats({
        revenue: '₹0', orders: '0', customers: '0', conversations: '0',
        revTrend: '0%', ordTrend: '0%', custTrend: '0%', convTrend: '0%'
      });
      setRecentOrders([]);
      setRecentActivity([]);
    }

    // Chart data (static for now, can be computed from orders)
    setRevenueData([
      { name: 'Mon', value: 4100 }, { name: 'Tue', value: 5800 },
      { name: 'Wed', value: 4900 }, { name: 'Thu', value: 7200 },
      { name: 'Fri', value: 6100 }, { name: 'Sat', value: 8500 },
      { name: 'Sun', value: 7600 }
    ]);
    setAgentData([
      { name: 'Sales', resolved: 140, escalated: 12 },
      { name: 'Support', resolved: 90, escalated: 8 },
      { name: 'Recommend', resolved: 80, escalated: 3 },
      { name: 'Marketing', resolved: 60, escalated: 5 }
    ]);
    setLoading(false);
  };

  const statCards = [
    { title: 'REVENUE', value: stats.revenue, trend: stats.revTrend, up: true, icon: DollarSign, gradient: 'from-emerald-500 to-teal-600' },
    { title: 'ORDERS', value: stats.orders, trend: stats.ordTrend, up: true, icon: ShoppingCart, gradient: 'from-blue-500 to-indigo-600' },
    { title: 'CUSTOMERS', value: stats.customers, trend: stats.custTrend, up: true, icon: Users, gradient: 'from-violet-500 to-purple-600' },
    { title: 'AI CONVERSATIONS', value: stats.conversations, trend: stats.convTrend, up: true, icon: MessageSquare, gradient: 'from-amber-500 to-orange-600' }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-border-color p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[13px] uppercase tracking-wide text-text-muted font-semibold">{item.title}</span>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center shadow-sm`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-text-main mb-2">{item.value}</div>
              <div className="text-[13px] font-medium text-status-active-text flex items-center gap-1">
                <ArrowUpRight size={14} /> {item.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="flex flex-col xl:flex-row gap-5">
        <div className="flex-[2] bg-white rounded-xl border border-border-color p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-main">
              <TrendingUp className="w-4 h-4 text-brand-green" /> Revenue Overview
            </div>
            <span className="text-xs text-text-muted bg-slate-50 px-3 py-1 rounded-full">This Week</span>
          </div>
          <div className="w-full h-[260px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10a37f" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10a37f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#0f172a', fontWeight: 600 }} />
                <Area type="monotone" dataKey="value" stroke="#10a37f" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex-[1] bg-white rounded-xl border border-border-color p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-main mb-6">
            <Bot className="w-4 h-4 text-brand-green" /> Agent Performance
          </div>
          <div className="w-full h-[260px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agentData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="resolved" stackId="a" fill="#10a37f" radius={[0, 0, 0, 0]} barSize={16} name="Resolved" />
                <Bar dataKey="escalated" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16} name="Escalated" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Orders + AI Activity */}
      <div className="flex flex-col xl:flex-row gap-5">
        {/* Recent Orders */}
        <div className="flex-[3] bg-white rounded-xl border border-border-color p-6 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text-main">Recent Orders</h3>
            <span className="text-xs text-brand-green font-medium cursor-pointer hover:underline">View All →</span>
          </div>
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr>
                {['Order ID', 'Customer', 'Product', 'Amount', 'Status'].map(th => (
                  <th key={th} className="py-3 px-2 text-[12px] font-semibold text-text-muted uppercase tracking-wide border-b border-border-color">{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, i) => (
                <tr key={i} className="border-b last:border-0 border-border-color hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-2 text-sm font-medium text-text-main">{order.id}</td>
                  <td className="py-3.5 px-2 text-sm text-text-main">{order.customer}</td>
                  <td className="py-3.5 px-2 text-sm text-slate-500">{order.product}</td>
                  <td className="py-3.5 px-2 text-sm font-semibold text-text-main">{order.amount}</td>
                  <td className="py-3.5 px-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-status-active-bg text-status-active-text' :
                        order.status === 'Shipped' ? 'bg-blue-50 text-blue-600' :
                          'bg-status-warning-bg text-status-warning-text'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Activity Feed */}
        <div className="flex-[2] bg-white rounded-xl border border-border-color p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-main mb-4">
            <Zap className="w-4 h-4 text-amber-500" /> AI Activity Feed
          </div>
          <div className="flex flex-col gap-3">
            {recentActivity.map((act, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-50/80 border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-brand-green-light text-brand-green flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare size={14} />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-text-main">{act.phone}</span>
                    <span className="text-[11px] text-text-muted flex items-center gap-1"><Clock size={10} /> {act.time}</span>
                  </div>
                  <p className="text-[12px] text-slate-500 truncate">📩 {act.message}</p>
                  <p className="text-[12px] text-brand-green truncate">🤖 {act.reply}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
