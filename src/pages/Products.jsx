import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useCompany } from '../context/CompanyContext';
import { Search, Plus, Package, RefreshCcw, X } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '', usage_days: '' });

  const { activeCompanyId } = useCompany();

  useEffect(() => { loadProducts(); }, [activeCompanyId]);

  const loadProducts = async () => {
    try {
      const q = query(collection(db, 'products'), where('companyId', '==', activeCompanyId));
      const snap = await getDocs(q);
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error loading products:", err);
      // No longer falling back to mock data to ensure real environment
      setProducts([]); 
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.stock) return;
    
    try {
      const stockNum = parseInt(newProduct.stock, 10);
      const added = {
        companyId: activeCompanyId,
        name: newProduct.name,
        category: newProduct.category,
        price: Number(newProduct.price),
        stock: stockNum,
        sales: 0,
        usage_days: newProduct.usage_days ? parseInt(newProduct.usage_days, 10) : null,
        status: stockNum > 10 ? 'Active' : stockNum > 0 ? 'Low Stock' : 'Out of Stock',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'products'), added);
      setProducts([{ id: docRef.id, ...added }, ...products]);
      setShowModal(false);
      setNewProduct({ name: '', category: '', price: '', stock: '', usage_days: '' });
    } catch (err) {
      console.error("Error adding product:", err);
      alert("Failed to save product. Please check your connection.");
    }
  };

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-5 relative">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 bg-white rounded-xl border border-border-color px-4 py-2.5 flex items-center gap-3 shadow-sm">
          <Search size={18} className="text-text-muted" />
          <input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="border-none w-full text-sm outline-none placeholder:text-text-muted" />
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary shrink-0">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((prod) => (
          <div key={prod.id} className="bg-white rounded-xl border border-border-color p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500">
                  <Package size={22} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[14px] font-semibold text-text-main">{prod.name}</span>
                  <span className="text-[12px] text-text-muted">{prod.category}</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                prod.status === 'Active' ? 'bg-brand-green text-white' :
                prod.status === 'Low Stock' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                'bg-red-600 text-white'
              }`}>{prod.status}</span>
            </div>

            {/* Usage Days Badge */}
            {prod.usage_days && (
              <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-brand-green-light rounded-lg">
                <RefreshCcw size={14} className="text-brand-green" />
                <span className="text-[12px] font-medium text-brand-green">Auto follow-up in {prod.usage_days} days after purchase</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-dashed border-border-color">
              <span className="text-xl font-bold text-text-main">₹{(prod.price || 0).toLocaleString('en-IN')}</span>
              <div className="flex gap-4 text-[13px] text-text-muted">
                <span>Stock: <strong className="text-text-main">{prod.stock}</strong></span>
                <span>Sales: <strong className="text-text-main">{prod.sales}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            <h2 className="text-lg font-semibold text-text-main mb-1">Add New Product</h2>
            <p className="text-[13px] text-text-muted mb-6">Add to your product catalog with optional auto follow-up.</p>
            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Product Name</label>
                <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} type="text" placeholder="e.g. Premium Perfume 100ml"
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Category</label>
                <select required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green bg-white appearance-none">
                  <option value="" disabled>Select Category</option>
                  <option value="Kurtas">Kurtas</option>
                  <option value="Sarees">Sarees</option>
                  <option value="Shirts">Shirts</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Blouses">Blouses</option>
                  <option value="Fragrances">Fragrances</option>
                  <option value="Bakery">Bakery</option>
                  <option value="Skincare">Skincare</option>
                  <option value="Healthcare">Healthcare</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-text-main">Price (₹)</label>
                  <input required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} type="number" min="0" placeholder="e.g. 1500"
                    className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-text-main">Initial Stock</label>
                  <input required value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} type="number" min="0" placeholder="e.g. 50"
                    className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Usage Duration (days) — <span className="text-text-muted font-normal">for auto reorder reminders</span></label>
                <input value={newProduct.usage_days} onChange={e => setNewProduct({...newProduct, usage_days: e.target.value})} type="number" min="1" placeholder="e.g. 30 (leave empty if N/A)"
                  className="w-full px-3 py-2 border border-border-color rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green" />
              </div>
              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-border-color">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg font-medium text-[13px] text-text-muted hover:bg-slate-50">Cancel</button>
                <button type="submit" className="bg-brand-green hover:bg-brand-green-hover text-white px-5 py-2 rounded-lg font-medium text-[13px] shadow-sm">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
