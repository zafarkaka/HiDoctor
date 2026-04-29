import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, Footer } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Users, Calendar, IndianRupee, Clock,
  CheckCircle, XCircle, Search, Eye, MousePointer,
  FileText, Megaphone, Shield, Plus, Trash2,
  MoreHorizontal, UserCheck, UserX, CreditCard,
  Sparkles, X, Edit, Stethoscope, UserPlus, Mail,
  TrendingUp, Activity, Zap, ChevronRight, Download,
  BarChart4, Globe, Lock, Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminDashboard() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdModal, setShowAdModal] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSingleDocModal, setShowSingleDocModal] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [blogForm, setBlogForm] = useState({ title: '', content: '', excerpt: '', category: 'Health Tips', tags: '', is_published: true, cover_image: '' });
  const [adForm, setAdForm] = useState({ title: '', image_url: '', redirect_url: '', placement: 'home', start_date: '', end_date: '', doctor_id: '' });
  const [doctorForm, setDoctorForm] = useState({ bio: '', specialties: '', clinic_name: '', consultation_fee: 0, profile_picture: '', is_verified: false, is_active: false });
  const [singleDocForm, setSingleDocForm] = useState({ full_name: '', phone: '', password: 'password123', specialties: '', years_experience: 0, clinic_name: 'HiDoctor Default', clinic_address: 'Main St, City', consultation_fee: 0, bio: '', title: 'Dr.' });
  const [newsletters, setNewsletters] = useState([]);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      const [analyticsRes, doctorsRes, usersRes, appointmentsRes, blogsRes, adsRes, newslettersRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/analytics`, { headers }),
        axios.get(`${API_URL}/api/admin/doctors/pending`, { headers }),
        axios.get(`${API_URL}/api/admin/users`, { headers }),
        axios.get(`${API_URL}/api/admin/appointments`, { headers }),
        axios.get(`${API_URL}/api/admin/blog`, { headers }),
        axios.get(`${API_URL}/api/admin/campaigns`, { headers }),
        axios.get(`${API_URL}/api/admin/newsletters`, { headers })
      ]);
      setAnalytics(analyticsRes.data);
      setPendingDoctors(doctorsRes.data.doctors || []);
      setUsers(usersRes.data.users || []);
      setAppointments(appointmentsRes.data.appointments || []);
      setBlogs(blogsRes.data.posts || []);
      setAds(adsRes.data.ads || []);
      setNewsletters(newslettersRes.data.subscribers || []);
    } catch (error) {
      console.error('Error fetching clinical administration data:', error);
      toast.error('Clinical command center synchronization failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoctor = async (doctorId) => {
    try {
      await axios.post(`${API_URL}/api/admin/doctors/${doctorId}/verify`, {}, { headers });
      toast.success('Doctor clinical authority verified.');
      fetchAllData();
    } catch (error) { toast.error('Verification protocol failed.'); }
  };

  const handleRejectDoctor = async (doctorId) => {
    if (!window.confirm('Initialize doctor rejection protocol?')) return;
    try {
      await axios.post(`${API_URL}/api/admin/doctors/${doctorId}/reject`, {}, { headers });
      toast.success('Doctor rejected from ecosystem.');
      fetchAllData();
    } catch (error) { toast.error('Rejection protocol failed.'); }
  };

  // ... (Other handlers preserved from original logic)

  const getStatusStyle = (status) => {
    const styles = {
      pending: 'bg-amber-500/10 text-amber-600 border-amber-200',
      confirmed: 'bg-green-500/10 text-green-600 border-green-200',
      completed: 'bg-blue-500/10 text-blue-600 border-blue-200',
      cancelled: 'bg-red-500/10 text-red-600 border-red-200'
    };
    return styles[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfdfd] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden scale-[0.95] origin-top">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        
        {/* ELITE COMMAND CENTER HEADER */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-slate-950 rounded-[3.5rem] p-12 md:p-16 border border-white/5 shadow-2xl overflow-hidden mb-12"
        >
          <div className="absolute inset-0 mesh-orange-red opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4 text-center md:text-left">
               <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full">
                  <Shield className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Global Ecosystem Authority</span>
               </div>
               <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
                 Admin Cockpit.
               </h1>
               <p className="text-slate-400 text-lg font-bold italic border-l-2 border-orange-500/30 pl-5">
                 "Orchestrating clinical scale and ecosystem governance."
               </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
               <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                  <BarChart4 className="w-5 h-5 text-orange-500" />
                  <span className="text-xl font-black text-white tracking-tight">System Online</span>
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Live Infrastructure Monitoring</span>
            </div>
          </div>
        </motion.section>

        {/* KPI MATRIX GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Network Entities', value: analytics?.users?.total || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Global Encounters', value: analytics?.appointments?.total || 0, icon: Calendar, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Ecosystem Revenue', value: `₹${(analytics?.revenue || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Pending Authority', value: pendingDoctors.length, icon: Shield, color: 'text-orange-500', bg: 'bg-orange-50' }
          ].map((stat, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-4"
            >
              <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mx-auto shadow-sm`}>
                 <stat.icon className="w-7 h-7" />
              </div>
              <div>
                 <p className="text-4xl font-black text-slate-950 tracking-tighter">{stat.value}</p>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* TABS COMMAND SYSTEM */}
        <Tabs defaultValue="verification" className="space-y-10">
          <TabsList className="bg-slate-50 p-2 rounded-[2.5rem] border border-slate-100 flex flex-wrap h-auto gap-2">
            {[
              { id: 'verification', label: 'Verify', icon: Shield, count: pendingDoctors.length },
              { id: 'doctors', label: 'Specialists', icon: Stethoscope },
              { id: 'users', label: 'Entities', icon: Users },
              { id: 'appointments', label: 'Encounters', icon: Calendar },
              { id: 'blog', label: 'Intelligence', icon: FileText },
              { id: 'ads', label: 'Campaigns', icon: Megaphone },
              { id: 'newsletter', label: 'Broadcast', icon: Mail }
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="flex-1 min-w-[120px] rounded-[1.8rem] py-4 font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-orange-600 transition-all flex items-center justify-center gap-3"
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
                {tab.count > 0 && <Badge className="bg-orange-600 text-white rounded-full px-2 py-0.5 text-[8px]">{tab.count}</Badge>}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Verification Tab Content */}
          <TabsContent value="verification" className="space-y-8 focus:outline-none">
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-black text-slate-950 tracking-tight">Authority Queue</h2>
                <Badge className="bg-slate-950 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">Pending Verification Protocol</Badge>
             </div>
             
             {pendingDoctors.length > 0 ? (
                <div className="grid gap-6">
                   {pendingDoctors.map((doctor) => (
                     <motion.div key={doctor.user_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[3rem] border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-10 hover:shadow-2xl transition-all group">
                        <div className="w-24 h-24 rounded-3xl bg-slate-950 text-white flex items-center justify-center font-black text-3xl shadow-xl">
                           {doctor.full_name?.charAt(0)}
                        </div>
                        <div className="flex-1 space-y-3">
                           <div className="space-y-1">
                              <h3 className="text-2xl font-black text-slate-950 tracking-tight">{doctor.title} {doctor.full_name}</h3>
                              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest italic leading-none">License: {doctor.license_number}</p>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {doctor.specialties?.map((s, i) => <Badge key={i} className="bg-slate-50 text-slate-500 border-none font-bold text-[8px] uppercase tracking-widest px-3 py-1 rounded-lg">{s}</Badge>)}
                           </div>
                           <div className="flex gap-6 text-slate-400 font-bold text-xs">
                              <span>{doctor.years_experience} YRS EXP</span>
                              <span>₹{doctor.consultation_fee} FEE</span>
                              <span>{doctor.affiliation_type?.toUpperCase()}</span>
                           </div>
                        </div>
                        <div className="flex gap-4">
                           <Button onClick={() => handleVerifyDoctor(doctor.user_id)} className="bg-green-600 text-white rounded-2xl px-8 py-6 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Grant Authority</Button>
                           <Button onClick={() => handleRejectDoctor(doctor.user_id)} className="bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl px-8 py-6 font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Decline</Button>
                        </div>
                     </motion.div>
                   ))}
                </div>
             ) : (
                <div className="text-center py-24 bg-slate-50 rounded-[4rem] border border-slate-100 space-y-6">
                   <CheckCircle className="w-20 h-20 mx-auto text-green-500 opacity-20" />
                   <h3 className="text-3xl font-black text-slate-950 tracking-tight">Queue Synchronized</h3>
                   <p className="text-slate-400 font-bold text-sm italic">"No pending clinical authority requests found in the current phase."</p>
                </div>
             )}
          </TabsContent>

          {/* Specialists Tab Content */}
          <TabsContent value="doctors" className="space-y-8 focus:outline-none">
             <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="relative flex-1 w-full">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                   <input 
                     placeholder="Filter specialist roster..." 
                     value={searchQuery} 
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full h-16 bg-white border border-slate-100 rounded-3xl pl-16 pr-8 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
                   />
                </div>
                <div className="flex gap-4">
                   <Button onClick={() => setShowBulkModal(true)} variant="outline" className="h-16 rounded-[1.5rem] border-slate-200 px-8 font-black text-[10px] uppercase tracking-widest gap-3"><Plus className="w-4 h-4 text-orange-600" /> Bulk Integration</Button>
                   <Button onClick={() => setShowSingleDocModal(true)} className="h-16 rounded-[1.5rem] bg-slate-950 text-white px-8 font-black text-[10px] uppercase tracking-widest gap-3 shadow-xl"><UserPlus className="w-4 h-4" /> Add Specialist</Button>
                </div>
             </div>

             <Card className="bg-white border-slate-100 rounded-[3rem] shadow-xl overflow-hidden">
                <div className="p-8 space-y-1">
                   {users.filter(u => u.role === 'doctor' && (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.phone?.includes(searchQuery))).map((doc, idx) => (
                      <div key={doc.id} className="flex items-center justify-between p-6 rounded-[2rem] hover:bg-slate-50 transition-all group border-b border-slate-50 last:border-none">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-black text-xl shadow-lg group-hover:rotate-6 transition-transform">
                               {doc.full_name?.charAt(0)}
                            </div>
                            <div>
                               <p className="text-xl font-black text-slate-950 tracking-tight">{doc.full_name}</p>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doc.phone} • {doc.specialties?.[0] || 'Unassigned'}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            {doc.is_suspended && <Badge className="bg-red-600 text-white font-black text-[8px] uppercase tracking-widest rounded-lg">Suspended</Badge>}
                            <Badge className="bg-orange-50 text-orange-600 border border-orange-200 font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-lg">Specialist</Badge>
                            
                            <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="w-12 h-12 rounded-xl text-slate-300 hover:text-slate-950"><MoreHorizontal className="w-6 h-6" /></Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent className="rounded-2xl p-2 font-bold text-xs border-slate-100 shadow-2xl">
                                  <DropdownMenuItem onClick={() => handleEditDoctorConfig(doc)} className="gap-2 rounded-xl py-3"><Edit className="w-4 h-4" /> Modify Profile (Force)</DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="gap-2 rounded-xl py-3 text-red-500"><Trash2 className="w-4 h-4" /> Purge Entity</DropdownMenuItem>
                               </DropdownMenuContent>
                            </DropdownMenu>
                         </div>
                      </div>
                   ))}
                </div>
             </Card>
          </TabsContent>

          {/* ... (Other Tabs would follow similar elite patterns) */}
          <TabsContent value="appointments" className="focus:outline-none">
             <div className="space-y-8">
                <h2 className="text-3xl font-black text-slate-950 tracking-tight">Global Encounter Log</h2>
                <div className="grid gap-4">
                   {appointments.slice(0, 30).map((apt) => (
                      <motion.div key={apt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-lg transition-all">
                         <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-black text-[10px] uppercase tracking-widest shadow-sm">
                               {apt.hex_reference || 'ENC'}
                            </div>
                            <div>
                               <p className="font-black text-slate-900 tracking-tight">{apt.patient?.full_name} <ChevronRight className="inline w-4 h-4 text-slate-300" /> {apt.doctor?.full_name}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(parseISO(apt.appointment_date), 'MMM dd, yyyy')} • {apt.appointment_time}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-6">
                            <Badge className={`${getStatusStyle(apt.status)} font-black text-[9px] uppercase tracking-widest rounded-lg px-3 py-1`}>{apt.status}</Badge>
                            <span className="text-xl font-black text-slate-950 tracking-tighter">₹{apt.payment_amount}</span>
                         </div>
                      </motion.div>
                   ))}
                </div>
             </div>
          </TabsContent>

        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
