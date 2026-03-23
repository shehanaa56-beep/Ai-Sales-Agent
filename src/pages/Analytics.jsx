import React from 'react';
import { TrendingUp, ShoppingCart, Users, Bot } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const revData = [ { name: 'Jan', value: 12000 }, { name: 'Feb', value: 16000 }, { name: 'Mar', value: 18000 }, { name: 'Apr', value: 17000 }, { name: 'May', value: 22000 }, { name: 'Jun', value: 25000 } ];
const perfData = [ { name: 'Sales', main: 800, error: 50 }, { name: 'Support', main: 600, error: 80 }, { name: 'Marketing', main: 400, error: 20 }, { name: 'Recommend', main: 750, error: 40 } ];
const pieData = [ { name: 'WhatsApp', value: 45 }, { name: 'Web Chat', value: 30 }, { name: 'Direct', value: 15 }, { name: 'Email', value: 10 } ];
const COLORS = ['#10a37f', '#0ea5e9', '#f1f5f9', '#94a3b8'];

const Analytics = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: 'TOTAL REVENUE', value: '$109,600', trend: '+18.2% vs last period', icon: TrendingUp },
          { title: 'TOTAL ORDERS', value: '1,516', trend: '+12.4% vs last period', icon: ShoppingCart },
          { title: 'ACTIVE CUSTOMERS', value: '847', trend: '+8.7% vs last period', icon: Users },
          { title: 'AI RESOLUTION RATE', value: '92.3%', trend: '-1.2% vs last period', down: true, icon: Bot }
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="bg-white rounded-lg border border-border-color p-6 flex flex-col shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[13px] uppercase tracking-wide text-text-muted font-semibold">{item.title}</span>
                <div className="text-slate-500"><Icon size={20} /></div>
              </div>
              <div className="text-3xl font-bold text-text-main mb-2">{item.value}</div>
              <div className={`text-[13px] font-medium ${item.down ? 'text-status-danger-text' : 'text-status-active-text'}`}>
                {item.trend}
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-lg border border-border-color p-6 shadow-sm">
          <div className="text-sm font-semibold text-text-main mb-4">Revenue Trend</div>
          <div className="w-full h-[260px]">
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
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#0f172a', fontWeight: 600 }} />
                <Area type="monotone" dataKey="value" stroke="#10a37f" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="xl:col-span-1 bg-white rounded-lg border border-border-color p-6 shadow-sm">
          <div className="text-sm font-semibold text-text-main mb-4">Channel Distribution</div>
          <div className="w-full h-[180px] flex justify-center">
            <PieChart width={200} height={180}>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} fill="#8884d8" paddingAngle={2} dataKey="value" stroke="none">
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-text-muted">
                <div style={{backgroundColor: COLORS[index]}} className="w-2 h-2 rounded-full"></div>
                {entry.name} ({entry.value}%)
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border-color p-6 shadow-sm">
        <div className="text-sm font-semibold text-text-main mb-4">AI Agent Performance</div>
        <div className="w-full h-[260px]">
          <ResponsiveContainer>
            <BarChart data={perfData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="main" fill="#10a37f" radius={[4, 4, 0, 0]} maxBarSize={60} />
              <Bar dataKey="error" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
