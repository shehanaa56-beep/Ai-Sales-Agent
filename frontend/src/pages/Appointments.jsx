import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, Clock, CheckCircle, XCircle, MoreVertical, Plus, User, Stethoscope } from 'lucide-react';
import { useCompany } from '../context/CompanyContext';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [newBooking, setNewBooking] = useState({ 
    customerName: '', 
    customerPhone: '', 
    service: '', 
    doctor: '', 
    date: '', 
    time: '' 
  });
  const { activeCompanyId } = useCompany();

  useEffect(() => {
    if (activeCompanyId) {
      loadAppointments();
    }
  }, [activeCompanyId]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_FUNCTIONS_URL}/getAppointments?companyId=${activeCompanyId}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setAppointments(data);
      }
    } catch (err) {
      console.error("Error loading appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBooking = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_FUNCTIONS_URL}/saveAppointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newBooking, companyId: activeCompanyId, status: 'Confirmed' })
      });
      if (response.ok) {
        setShowModal(false);
        setNewBooking({ customerName: '', customerPhone: '', service: '', doctor: '', date: '', time: '' });
        loadAppointments();
      }
    } catch (err) {
      console.error("Error saving appointment:", err);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await fetch(`${import.meta.env.VITE_FUNCTIONS_URL}/updateAppointmentStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id, status: newStatus })
      });
      setAppointments(appointments.map(app => app.id === id ? { ...app, status: newStatus } : app));
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const filtered = appointments.filter(app => {
    const matchesSearch = (app.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (app.service || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || app.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Confirmed': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: appointments.length, icon: Calendar, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Pending', value: appointments.filter(a => a.status === 'Pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Confirmed', value: appointments.filter(a => a.status === 'Confirmed').length, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completed', value: appointments.filter(a => a.status === 'Completed').length, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} p-6 rounded-2xl border border-white shadow-sm flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg.replace('50', '100')}`}>
              <stat.icon size={24} className={stat.color} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex bg-slate-50 rounded-lg p-1 w-full md:w-auto">
          {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-md transition-all ${
                filterStatus === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients or services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-200 transition-all"
            />
          </div>
          <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-all">
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 font-medium">Loading appointments...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
              <Calendar size={32} />
            </div>
            <div className="text-center">
              <p className="text-slate-900 font-semibold italic">No appointments found</p>
              <p className="text-xs text-slate-400">Try adjusting your filters or wait for AI bookings.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Patient & Service</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{app.customerName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-500">{app.service}</p>
                            <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 rounded uppercase font-bold tracking-tighter">{app.source}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                          <Calendar size={14} className="text-slate-400" />
                          {app.date}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock size={14} className="text-slate-400" />
                          {app.time}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Stethoscope size={16} className="text-slate-400" />
                        {app.doctor || 'General Duty'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusStyle(app.status)}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {app.status === 'Pending' && (
                          <button onClick={() => updateStatus(app.id, 'Confirmed')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Confirm">
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {app.status !== 'Completed' && app.status !== 'Cancelled' && (
                           <button onClick={() => updateStatus(app.id, 'Completed')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Mark Completed">
                              <CheckCircle size={18} />
                           </button>
                        )}
                        {app.status !== 'Cancelled' && (
                          <button onClick={() => updateStatus(app.id, 'Cancelled')} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Cancel">
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
              <XCircle size={24} />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">New Manual Booking</h2>
            <p className="text-sm text-slate-500 mb-8 font-medium">Create a new appointment for walk-in patients.</p>
            
            <form onSubmit={handleAddBooking} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider px-1">Patient Name</label>
                  <input required value={newBooking.customerName} onChange={e => setNewBooking({...newBooking, customerName: e.target.value})} type="text" placeholder="Full Name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-200 transition-all font-medium" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider px-1">Phone Number</label>
                  <input required value={newBooking.customerPhone} onChange={e => setNewBooking({...newBooking, customerPhone: e.target.value})} type="text" placeholder="WhatsApp Number"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-200 transition-all font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider px-1">Service / Reason</label>
                  <input required value={newBooking.service} onChange={e => setNewBooking({...newBooking, service: e.target.value})} type="text" placeholder="e.g. Dental Checkup"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-200 transition-all font-medium" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider px-1">Doctor (Optional)</label>
                  <input value={newBooking.doctor} onChange={e => setNewBooking({...newBooking, doctor: e.target.value})} type="text" placeholder="e.g. Dr. Sarah"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-200 transition-all font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider px-1">Date</label>
                  <input required value={newBooking.date} onChange={e => setNewBooking({...newBooking, date: e.target.value})} type="date"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-200 transition-all font-medium" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-slate-400 uppercase tracking-wider px-1">Time</label>
                  <input required value={newBooking.time} onChange={e => setNewBooking({...newBooking, time: e.target.value})} type="time"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-200 transition-all font-medium" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-50 transition-all">Cancel</button>
                <button type="submit" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 active:scale-95 transition-all">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
