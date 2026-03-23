import React from 'react';
import { DollarSign, ShoppingCart, Users, MessageSquare, TrendingUp, Bot } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const revenueData = [ { name: 'Mon', value: 4100 }, { name: 'Tue', value: 5800 }, { name: 'Wed', value: 4900 }, { name: 'Thu', value: 7200 }, { name: 'Fri', value: 6100 }, { name: 'Sat', value: 8500 }, { name: 'Sun', value: 7600 } ];
const agentData = [ { name: 'Sales', val1: 140, val2: 120 }, { name: 'Support', val1: 90, val2: 85 }, { name: 'Recommend', val1: 80, val2: 78 }, { name: 'Marketing', val1: 60, val2: 45 } ];
const recentOrders = [ { id: '#ORD-2841', customer: 'Arjun K.', amount: '₹2,450', status: 'Delivered' }, { id: '#ORD-2840', customer: 'Meera S.', amount: '₹1,890', status: 'Processing' }, { id: '#ORD-2839', customer: 'Ravi M.', amount: '₹3,200', status: 'Shipped' }, { id: '#ORD-2838', customer: 'Priya L.', amount: '₹980', status: 'Delivered' }, { id: '#ORD-2837', customer: 'Anil R.', amount: '₹4,100', status: 'Processing' } ];

const Dashboard = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: 'REVENUE', value: '₹44,200', trend: '+12.5% vs last week', up: true, icon: DollarSign },
          { title: 'ORDERS', value: '251', trend: '+8.2% vs last week', up: true, icon: ShoppingCart },
          { title: 'CUSTOMERS', value: '1,429', trend: '+3.1% vs last week', up: true, icon: Users },
          { title: 'AI CONVERSATIONS', value: '370', trend: '+22% vs last week', up: true, icon: MessageSquare }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white rounded-lg border border-border-color p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[13px] uppercase tracking-wide text-text-muted font-semibold">{item.title}</span>
                <div className="w-10 h-10 rounded-lg bg-brand-green-light text-brand-green flex items-center justify-center">
                  <Icon size={20} />
                </div>
              </div>
              <div className="text-3xl font-bold text-text-main mb-2">{item.value}</div>
              <div className={`text-[13px] font-medium ${item.up ? 'text-status-active-text' : 'text-status-danger-text'}`}>
                {item.trend}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col xl:flex-row gap-5">
        <div className="flex-[2] bg-white rounded-lg border border-border-color p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-main mb-6">
            <TrendingUp className="w-4 h-4 text-brand-green" /> Revenue Overview
          </div>
          <div className="w-full h-[260px]">
            <ResponsiveContainer>
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10a37f" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10a37f" stopOpacity={0}/>
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
        <div className="flex-[1] bg-white rounded-lg border border-border-color p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-main mb-6">
            <Bot className="w-4 h-4 text-brand-green" /> Agent Performance
          </div>
          <div className="w-full h-[260px]">
            <ResponsiveContainer>
              <BarChart data={agentData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={80} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="val1" stackId="a" fill="#10a37f" radius={[0, 0, 0, 0]} barSize={16} />
                <Bar dataKey="val2" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border-color p-6 shadow-sm overflow-x-auto">
        <h3 className="text-base font-semibold text-text-main mb-4">Recent Orders</h3>
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="py-4 px-2 text-[12px] font-semibold text-text-muted uppercase tracking-wide border-b border-border-color">Order ID</th>
              <th className="py-4 px-2 text-[12px] font-semibold text-text-muted uppercase tracking-wide border-b border-border-color">Customer</th>
              <th className="py-4 px-2 text-[12px] font-semibold text-text-muted uppercase tracking-wide border-b border-border-color">Amount</th>
              <th className="py-4 px-2 text-[12px] font-semibold text-text-muted uppercase tracking-wide border-b border-border-color">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order, i) => (
              <tr key={i} className="border-b last:border-0 border-border-color">
                <td className="py-4 px-2 text-sm font-medium text-text-main">{order.id}</td>
                <td className="py-4 px-2 text-sm text-text-main">{order.customer}</td>
                <td className="py-4 px-2 text-sm font-semibold text-text-main">{order.amount}</td>
                <td className="py-4 px-2 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-status-active-bg text-status-active-text' : order.status === 'Shipped' ? 'bg-slate-100 text-slate-600' : 'bg-status-warning-bg text-status-warning-text'}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
