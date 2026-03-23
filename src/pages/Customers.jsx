import React from 'react';
import { Search, Phone, ShoppingBag, Calendar } from 'lucide-react';

const customers = [
  { name: 'Arjun K.', phone: '+91 98765 43210', status: 'VIP', spent: '₹28,400', orders: 12, date: 'Mar 22, 2026' },
  { name: 'Meera S.', phone: '+91 87654 32109', status: 'Regular', spent: '₹15,200', orders: 8, date: 'Mar 22, 2026' },
  { name: 'Ravi M.', phone: '+91 76543 21098', status: 'Regular', spent: '₹9,800', orders: 5, date: 'Mar 21, 2026' },
  { name: 'Priya L.', phone: '+91 65432 10987', status: 'VIP', spent: '₹42,100', orders: 22, date: 'Mar 21, 2026' },
  { name: 'Anil R.', phone: '+91 54321 09876', status: 'New', spent: '₹6,200', orders: 3, date: 'Mar 20, 2026' },
  { name: 'Deepa V.', phone: '+91 43210 98765', status: 'VIP', spent: '₹31,500', orders: 15, date: 'Mar 20, 2026' },
];

const Customers = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="col-span-1 md:col-span-2 bg-white rounded-lg border border-border-color px-4 py-3 flex items-center gap-3 shadow-sm">
        <Search size={18} className="text-text-muted" />
        <input type="text" placeholder="Search customers..." className="border-none w-full text-sm outline-none placeholder:text-text-muted" />
      </div>

      {customers.map((cust, i) => (
        <div key={i} className="bg-white rounded-lg border border-border-color p-6 flex flex-col shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold text-text-main">{cust.name}</span>
              <span className="text-[13px] text-text-muted flex items-center gap-1.5"><Phone size={12} /> {cust.phone}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cust.status === 'VIP' ? 'bg-brand-green text-white' : cust.status === 'New' ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'bg-slate-100 text-slate-600'}`}>
              {cust.status}
            </span>
          </div>

          <div className="flex justify-between pt-5 border-t border-dashed border-border-color">
            <div className="flex flex-col items-center gap-1">
              <div className="text-text-muted mb-1"><ShoppingBag size={14} /></div>
              <span className="text-base font-semibold text-text-main">{cust.orders}</span>
              <span className="text-xs text-text-muted">Orders</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-semibold text-text-main pt-[22px]">{cust.spent}</span>
              <span className="text-xs text-text-muted">Total Spent</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-text-muted mb-1"><Calendar size={14} /></div>
              <span className="text-xs text-text-muted pt-6">{cust.date}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Customers;
