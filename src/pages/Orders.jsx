import React from 'react';

const allOrders = [
  { id: '#ORD-2841', customer: 'Arjun K.', items: 'Blue Kurta × 2, Stole × 1', amount: '₹2,450', date: 'Mar 22, 2026', status: 'Delivered', source: 'WhatsApp' },
  { id: '#ORD-2840', customer: 'Meera S.', items: 'Silk Saree × 1', amount: '₹1,890', date: 'Mar 22, 2026', status: 'Processing', source: 'WhatsApp' },
  { id: '#ORD-2839', customer: 'Ravi M.', items: 'Cotton Shirt × 3', amount: '₹3,200', date: 'Mar 21, 2026', status: 'Shipped', source: 'Web Chat' },
  { id: '#ORD-2838', customer: 'Priya L.', items: 'Dupatta × 2', amount: '₹980', date: 'Mar 21, 2026', status: 'Delivered', source: 'WhatsApp' },
  { id: '#ORD-2837', customer: 'Anil R.', items: 'Bulk: Fabric Set × 10', amount: '₹4,100', date: 'Mar 20, 2026', status: 'Processing', source: 'Web Chat' },
  { id: '#ORD-2836', customer: 'Deepa V.', items: 'Designer Blouse × 1', amount: '₹1,200', date: 'Mar 20, 2026', status: 'Delivered', source: 'WhatsApp' },
];

const Orders = () => {
  return (
    <div className="bg-white rounded-lg border border-border-color p-6 overflow-x-auto shadow-sm">
      <div className="text-base font-semibold text-text-main mb-6">All Orders</div>
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr>
            {['Order ID', 'Customer', 'Items', 'Amount', 'Date', 'Status', 'Source'].map(th => (
              <th key={th} className="py-4 px-2 text-[13px] font-semibold text-text-muted tracking-wide border-b border-border-color">{th}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allOrders.map((order, i) => (
            <tr key={i} className="border-b last:border-0 border-border-color">
              <td className="py-4 px-2 text-sm font-medium text-text-main">{order.id}</td>
              <td className="py-4 px-2 text-sm text-text-main">{order.customer}</td>
              <td className="py-4 px-2 text-sm text-slate-500">{order.items}</td>
              <td className="py-4 px-2 text-sm font-semibold text-text-main">{order.amount}</td>
              <td className="py-4 px-2 text-sm text-slate-500">{order.date}</td>
              <td className="py-4 px-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-status-active-bg text-status-active-text' : order.status === 'Shipped' ? 'bg-slate-100 text-slate-600' : 'bg-status-warning-bg text-status-warning-text'}`}>
                  {order.status}
                </span>
              </td>
              <td className="py-4 px-2">
                <span className="px-2.5 py-1 rounded-full text-xs bg-slate-50 border border-border-color text-text-muted">{order.source}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Orders;
