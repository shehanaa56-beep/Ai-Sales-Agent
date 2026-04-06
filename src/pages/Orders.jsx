import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCompany } from '../context/CompanyContext';
import { Search, RefreshCcw } from 'lucide-react';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const { activeCompanyId } = useCompany();

  useEffect(() => {
    loadOrders();
  }, [activeCompanyId]);

  const loadOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), where('companyId', '==', activeCompanyId));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(data);
    } catch (err) {
      console.error("Error loading orders:", err);

      // Demo data
      setOrders([
        { order_id: '#ORD-2841', customer_phone: '9876543210', customer_name: 'Arjun K.', product: 'Blue Kurta × 2, Stole × 1', amount: 2450, purchase_date: '2026-03-22', status: 'Delivered', source: 'WhatsApp', usage_days: 30 },
        { order_id: '#ORD-2840', customer_phone: '8765432109', customer_name: 'Meera S.', product: 'Silk Saree × 1', amount: 1890, purchase_date: '2026-03-22', status: 'Processing', source: 'WhatsApp', usage_days: null },
        { order_id: '#ORD-2839', customer_phone: '7654321098', customer_name: 'Ravi M.', product: 'Cotton Shirt × 3', amount: 3200, purchase_date: '2026-03-21', status: 'Shipped', source: 'Web Chat', usage_days: null },
        { order_id: '#ORD-2838', customer_phone: '6543210987', customer_name: 'Priya L.', product: 'Dupatta × 2', amount: 980, purchase_date: '2026-03-21', status: 'Delivered', source: 'WhatsApp', usage_days: null },
        { order_id: '#ORD-2837', customer_phone: '5432109876', customer_name: 'Anil R.', product: 'Bulk: Fabric Set × 10', amount: 4100, purchase_date: '2026-03-20', status: 'Processing', source: 'Web Chat', usage_days: null },
        { order_id: '#ORD-2836', customer_phone: '4321098765', customer_name: 'Deepa V.', product: 'Designer Blouse × 1', amount: 1200, purchase_date: '2026-03-20', status: 'Delivered', source: 'WhatsApp', usage_days: null },
        { order_id: '#ORD-2835', customer_phone: '9876543210', customer_name: 'Arjun K.', product: 'Premium Perfume 100ml', amount: 2800, purchase_date: '2026-03-15', status: 'Delivered', source: 'WhatsApp', usage_days: 30 },
        { order_id: '#ORD-2834', customer_phone: '8765432109', customer_name: 'Meera S.', product: 'Birthday Cake - Chocolate', amount: 1500, purchase_date: '2026-03-10', status: 'Delivered', source: 'WhatsApp', usage_days: null },
      ]);
    }
  };

  const statuses = ['All', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

  const filtered = orders.filter(o => {
    const matchesSearch = (o.customer_name || o.customer_phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.order_id || o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.product || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = filtered.reduce((sum, o) => sum + (o.amount || 0), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border-color p-4 shadow-sm">
          <span className="text-[12px] text-text-muted font-semibold uppercase">Total Orders</span>
          <div className="text-2xl font-bold text-text-main mt-1">{filtered.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-border-color p-4 shadow-sm">
          <span className="text-[12px] text-text-muted font-semibold uppercase">Revenue</span>
          <div className="text-2xl font-bold text-text-main mt-1">₹{totalRevenue.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white rounded-xl border border-border-color p-4 shadow-sm">
          <span className="text-[12px] text-text-muted font-semibold uppercase">Processing</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">{orders.filter(o => o.status === 'Processing').length}</div>
        </div>
        <div className="bg-white rounded-xl border border-border-color p-4 shadow-sm">
          <span className="text-[12px] text-text-muted font-semibold uppercase">Follow-ups Due</span>
          <div className="text-2xl font-bold text-brand-green mt-1 flex items-center gap-2">
            {orders.filter(o => o.usage_days).length}
            <RefreshCcw size={16} className="text-brand-green" />
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 bg-white rounded-xl border border-border-color px-4 py-2.5 flex items-center gap-3 shadow-sm">
          <Search size={18} className="text-text-muted" />
          <input
            type="text"
            placeholder="Search by order ID, customer, or product..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border-none w-full text-sm outline-none placeholder:text-text-muted"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar scroll-smooth">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all border ${
                statusFilter === s
                  ? 'bg-brand-green text-white border-brand-green shadow-lg shadow-brand-green/20 scale-[1.02]'
                  : 'bg-white text-text-muted border-border-color hover:border-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-border-color p-6 overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              {['Order ID', 'Customer', 'Product', 'Amount', 'Date', 'Follow-up', 'Status', 'Source'].map(th => (
                <th key={th} className="py-3.5 px-2 text-[12px] font-semibold text-text-muted uppercase tracking-wide border-b border-border-color">{th}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((order, i) => (
              <tr key={i} className="border-b last:border-0 border-border-color hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-2 text-sm font-medium text-text-main">{order.order_id || order.id}</td>
                <td className="py-4 px-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-text-main">{order.customer_name || 'Unknown'}</span>
                    <span className="text-[11px] text-text-muted">{order.customer_phone}</span>
                  </div>
                </td>
                <td className="py-4 px-2 text-sm text-slate-500 max-w-[200px] truncate">{order.product}</td>
                <td className="py-4 px-2 text-sm font-semibold text-text-main">₹{(order.amount || 0).toLocaleString('en-IN')}</td>
                <td className="py-4 px-2 text-sm text-slate-500">{order.purchase_date}</td>
                <td className="py-4 px-2">
                  {order.usage_days ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium bg-brand-green-light text-brand-green">
                      <RefreshCcw size={10} /> {order.usage_days}d
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">—</span>
                  )}
                </td>
                <td className="py-4 px-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm transition-all ${
                    order.status === 'Paid' ? 'bg-emerald-500 text-white shadow-emerald-200 animate-pulse' :
                    order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    order.status === 'Shipped' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border border-red-100' :
                    'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {order.status === 'Paid' ? '✅ Paid' : order.status}
                  </span>
                </td>
                <td className="py-4 px-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                    order.source === 'WhatsApp' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-slate-50 border border-border-color text-text-muted'
                  }`}>{order.source}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">No orders found matching your criteria.</div>
        )}
      </div>
    </div>
  );
};

export default Orders;
