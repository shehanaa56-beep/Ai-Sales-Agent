import React, { useState } from 'react';
import { Search, Package, Plus, X } from 'lucide-react';

const initialProducts = [
  { id: 1, name: 'Blue Silk Kurta', category: 'Kurtas', price: '₹1,200', stock: 45, sales: 128, status: 'Active', statusCode: 'active' },
  { id: 2, name: 'Designer Stole', category: 'Accessories', price: '₹450', stock: 120, sales: 89, status: 'Active', statusCode: 'active' },
  { id: 3, name: 'Cotton Shirt (White)', category: 'Shirts', price: '₹890', stock: 8, sales: 67, status: 'Low Stock', statusCode: 'low' },
  { id: 4, name: 'Silk Saree - Kanchipuram', category: 'Sarees', price: '₹3,500', stock: 15, sales: 54, status: 'Active', statusCode: 'active' },
  { id: 5, name: 'Printed Dupatta', category: 'Accessories', price: '₹380', stock: 0, sales: 203, status: 'Out of Stock', statusCode: 'out' },
  { id: 6, name: 'Embroidered Blouse', category: 'Blouses', price: '₹950', stock: 32, sales: 76, status: 'Active', statusCode: 'active' },
];

const Products = () => {
  const [products, setProducts] = useState(initialProducts);
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '', stock: '' });

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.stock) return;
    
    const stockNum = parseInt(newProduct.stock, 10);
    const added = {
      id: Date.now(),
      name: newProduct.name,
      category: newProduct.category,
      price: `₹${Number(newProduct.price).toLocaleString('en-IN')}`,
      stock: stockNum,
      sales: 0,
      status: stockNum > 10 ? 'Active' : stockNum > 0 ? 'Low Stock' : 'Out of Stock',
      statusCode: stockNum > 10 ? 'active' : stockNum > 0 ? 'low' : 'out',
    };
    
    setProducts([added, ...products]);
    setShowModal(false);
    setNewProduct({ name: '', category: '', price: '', stock: '' });
  };

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 bg-white rounded-lg border border-border-color px-4 py-2.5 flex items-center gap-3 shadow-sm">
          <Search size={18} className="text-text-muted" />
          <input type="text" placeholder="Search products..." className="border-none w-full text-sm outline-none placeholder:text-text-muted" />
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary shrink-0">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {products.map((prod) => (
          <div key={prod.id} className="bg-white rounded-lg border border-border-color p-5 flex flex-col shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                  <Package size={20} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[15px] font-semibold text-text-main">{prod.name}</span>
                  <span className="text-xs text-text-muted">{prod.category}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${prod.statusCode === 'active' ? 'bg-brand-green text-white' : prod.statusCode === 'low' ? 'bg-slate-100 text-text-muted border border-slate-200' : 'bg-red-600 text-white'}`}>
                {prod.status}
              </span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-dashed border-border-color">
              <span className="text-lg font-bold text-text-main">{prod.price}</span>
              <div className="flex gap-4 text-[13px] text-text-muted">
                <span>Stock: {prod.stock}</span>
                <span>Sales: {prod.sales}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-lg font-semibold text-text-main mb-1">Add New Product</h2>
            <p className="text-[13px] text-text-muted mb-6">Enter the details of the new catalog item.</p>
            
            <form onSubmit={handleAdd} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Product Name</label>
                <input required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} type="text" placeholder="e.g. Designer Saree" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green shadow-sm" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-text-main">Category</label>
                <select required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green bg-white shadow-sm appearance-none">
                  <option value="" disabled>Select Category</option>
                  <option value="Kurtas">Kurtas</option>
                  <option value="Sarees">Sarees</option>
                  <option value="Shirts">Shirts</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Blouses">Blouses</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-text-main">Price (₹)</label>
                  <input required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} type="number" min="0" placeholder="e.g. 1500" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green shadow-sm" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium text-text-main">Initial Stock</label>
                  <input required value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} type="number" min="0" placeholder="e.g. 50" className="w-full px-3 py-2 border border-border-color rounded-md text-sm outline-none focus:ring-1 focus:ring-brand-green focus:border-brand-green shadow-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-color">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-md font-medium text-[13px] text-text-muted hover:bg-slate-50 transition-colors border border-transparent">Cancel</button>
                <button type="submit" className="bg-brand-green hover:bg-brand-green-hover transition-colors text-white px-5 py-2 rounded-md font-medium text-[13px] shadow-sm">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
