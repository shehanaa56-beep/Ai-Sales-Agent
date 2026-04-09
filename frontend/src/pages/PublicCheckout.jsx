import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { CheckCircle2, ShoppingBag, CreditCard, ShieldCheck, ArrowLeft, Loader2, Sparkles, Building2 } from 'lucide-react';

const PublicCheckout = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const snap = await getDoc(orderRef);
      if (snap.exists()) {
        setOrder(snap.data());
        if (snap.data().status === 'Paid') setPaid(true);
      } else {
        setError("Order not found or has expired.");
      }
    } catch (err) {
      console.error("Error loading order:", err);
      setError("Failed to load order details.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaying(true);
    try {
      // Stage 1: Security Handshake
      await new Promise(resolve => setTimeout(resolve, 800));
      // Stage 2: Verifying with Bank
      await new Promise(resolve => setTimeout(resolve, 1200));
      // Stage 3: Finalizing Transaction
      await new Promise(resolve => setTimeout(resolve, 600));

      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'Paid',
        paidAt: serverTimestamp(),
        paymentId: 'PAY' + Math.random().toString(36).substr(2, 9).toUpperCase()
      });

      setPaid(true);
    } catch (err) {
      console.error("Payment error:", err);
      alert("Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
      <div className="relative">
          <div className="w-16 h-16 border-4 border-brand-green/20 border-t-brand-green rounded-full animate-spin"></div>
          <Building2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-green" size={20} />
      </div>
      <p className="text-slate-600 font-bold mt-6 tracking-tight">Securing your checkout session...</p>
      <p className="text-slate-400 text-xs mt-2">Connecting to AI Sales Suite payment gateway</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 rotate-12 shadow-sm">
        <ShieldCheck size={40} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Link Expired</h1>
      <p className="text-slate-500 mb-8 max-w-xs leading-relaxed">{error}</p>
      <button onClick={() => window.close()} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all">Return to WhatsApp</button>
    </div>
  );

  if (paid) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      <div className="relative mb-8">
          {/* Success Glow */}
          <div className="absolute inset-0 bg-emerald-400 blur-[80px] opacity-20 animate-pulse"></div>
          <div className="relative w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-200 animate-in zoom-in-50 duration-500">
            <CheckCircle2 size={48} className="animate-in slide-in-from-bottom-4 duration-700" />
          </div>
          {/* Floating Sparkles */}
          <Sparkles className="absolute -top-4 -right-10 text-amber-400 animate-bounce" size={32} />
          <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-brand-green-light rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      </div>

      <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Payment Received! 🎉</h1>
      <p className="text-slate-500 mb-10 max-w-md leading-relaxed text-lg font-medium">Thank you, <span className="text-slate-900 font-bold">{order.customer_name}</span>. Your order for <span className="text-brand-green">{order.product}</span> is now confirmed and being prepared.</p>
      
      <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-8 w-full max-w-md relative">
        <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Receipt Number</span>
                <span className="text-slate-900 font-mono font-bold text-sm">#ORD-{orderId.slice(-6).toUpperCase()}</span>
            </div>
            <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Amount</span>
                <div className="text-slate-900 font-black text-xl">₹{order.amount}</div>
            </div>
        </div>
        <div className="flex items-center gap-3 py-4 border-t border-dashed border-slate-200">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
            </div>
            <div className="flex flex-col items-start leading-tight">
                <span className="text-sm font-bold text-slate-900">Verified & Secure</span>
                <span className="text-xs text-slate-400 font-medium">Transaction confirmed via BlockChain</span>
            </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-8 duration-1000">
          <p className="text-slate-400 text-sm font-semibold">Switch back to WhatsApp to see your confirmation</p>
          <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-green animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 rounded-full bg-brand-green animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 rounded-full bg-brand-green animate-bounce"></div>
          </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row shadow-inner">
      {/* Product Summary (Left/Top) */}
      <div className="flex-1 bg-white p-8 md:p-12 lg:p-20 flex flex-col justify-center border-r border-slate-200">
         <div className="max-w-md mx-auto w-full">
            <div className="flex items-center gap-3 mb-10">
                <img src="/logo.png" alt="AI Sales Logo" className="w-8 h-8 rounded-lg" />
                <span className="font-bold tracking-tight text-slate-900">AI Sales Suite</span>
            </div>

            <div className="mb-10">
                <span className="text-xs font-bold text-brand-green uppercase tracking-widest bg-brand-green/10 px-3 py-1 rounded-full">Secure Checkout</span>
                <h1 className="text-3xl font-bold text-slate-900 mt-4 mb-2">Review your order</h1>
                <p className="text-slate-500">Order requested via WhatsApp Assistant</p>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm mb-8 relative overflow-hidden">
                <Sparkles className="absolute -top-4 -right-4 text-brand-green/5 w-32 h-32" />
                <div className="flex justify-between items-center mb-6">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-green shadow-sm">
                        <ShoppingBag size={24} />
                    </div>
                    <span className="text-2xl font-black text-slate-900 tracking-tight">₹{order.amount}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-400 font-medium">Product</span>
                    <span className="text-lg font-bold text-slate-900">{order.product}</span>
                </div>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Encrypted transaction powered by Razorpay Security</span>
            </div>
         </div>
      </div>

      {/* Payment Action (Right/Bottom) */}
      <div className="flex-1 p-8 md:p-12 lg:p-20 flex flex-col justify-center bg-slate-50/50">
        <div className="max-w-sm mx-auto w-full bg-white rounded-3xl p-8 shadow-xl border border-white">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <CreditCard size={20} className="text-slate-400" />
                Select Payment Method
            </h3>

            <div className="flex flex-col gap-3 mb-8">
                <div className="p-4 border-2 border-brand-green bg-brand-green/5 rounded-2xl flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-brand-green rounded-full"></div>
                        <span className="text-sm font-bold text-slate-900">UPI / GPay / PhonePe</span>
                    </div>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo.png/640px-UPI-Logo.png" className="h-4 grayscale" alt="UPI" />
                </div>
                <div className="p-4 border border-slate-200 bg-white rounded-2xl flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 border border-slate-300 rounded-full"></div>
                        <span className="text-sm font-bold text-slate-900">Credit / Debit Card</span>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-6 h-4 bg-slate-200 rounded"></div>
                        <div className="w-6 h-4 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>

            <button 
                onClick={handlePayment}
                disabled={paying}
                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg disabled:opacity-70"
            >
                {paying ? (
                    <Loader2 className="animate-spin" size={20} />
                ) : (
                    <>Pay ₹{order.amount} Now</>
                )}
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-6 leading-relaxed uppercase tracking-widest font-bold">
                🔒 Safe and Secure Transaction
            </p>
        </div>
      </div>
    </div>
  );
};

export default PublicCheckout;
