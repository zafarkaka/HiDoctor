import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, MobileNav, Footer } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Bell,
  ArrowRight,
  Search,
  Plus,
  Home,
  Shield,
  Star,
  Activity,
  Zap,
  TrendingUp,
  Heart,
  ChevronRight
} from 'lucide-react';
import { Calendar as CalendarUI } from '../components/ui/calendar';
import axios from 'axios';
import { format, parseISO, isToday, isTomorrow, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function PatientDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [familyCount, setFamilyCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, familyRes, adsRes] = await Promise.all([
        axios.get(`${API_URL}/api/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/family-members`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/campaigns?placement=patient_dashboard`)
      ]);
      setAppointments(appointmentsRes.data.appointments || []);
      setFamilyCount(familyRes.data.count || 0);
      setAds(adsRes.data.ads || []);
    } catch (error) {
      console.error('Error fetching clinical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: 'bg-amber-500/10 text-amber-600 border-amber-200',
      confirmed: 'bg-green-500/10 text-green-600 border-green-200',
      completed: 'bg-blue-500/10 text-blue-600 border-blue-200',
      cancelled: 'bg-red-500/10 text-red-600 border-red-200'
    };
    return styles[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const upcomingAppointments = appointments.filter(
    apt => ['pending', 'confirmed'].includes(apt.status) && new Date(apt.appointment_date) >= new Date().setHours(0, 0, 0, 0)
  ).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden scale-[0.95] origin-top pb-24 md:pb-0">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        
        {/* ELITE WELCOME BANNER */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-slate-950 rounded-[3.5rem] p-12 md:p-16 border border-white/5 shadow-2xl overflow-hidden mb-12"
        >
          <div className="absolute inset-0 mesh-orange-red opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4 text-center md:text-left">
               <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full">
                  <Activity className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Health Channel Active</span>
               </div>
               <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
                 Welcome, {user?.full_name?.split(' ')[0]}.
               </h1>
               <p className="text-slate-400 text-lg font-bold italic border-l-2 border-orange-500/30 pl-5">
                 "Your clinical ecosystem is synchronized and secured."
               </p>
            </div>
            <div className="flex gap-4">
               <Button onClick={() => navigate('/doctors')} className="bg-white hover:bg-orange-50 text-slate-950 rounded-2xl px-10 py-7 font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                  Initialize Search
               </Button>
               <Button variant="outline" onClick={() => navigate('/family-members')} className="border-white/10 text-white hover:bg-white/5 rounded-2xl px-10 py-7 font-black text-xs uppercase tracking-widest">
                  Network Hub
               </Button>
            </div>
          </div>
        </motion.section>

        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* STATS MATRIX */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Visits', value: appointments.length, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Finished', value: appointments.filter(a => a.status === 'completed').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Active', value: appointments.filter(a => a.status === 'confirmed').length, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Network', value: familyCount, icon: Users, color: 'text-red-600', bg: 'bg-red-50' }
              ].map((stat, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg text-center space-y-3"
                >
                  <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mx-auto shadow-sm`}>
                     <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-3xl font-black text-slate-950 tracking-tighter">{stat.value}</p>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* UPCOMING APPOINTMENTS */}
            <div className="space-y-8">
               <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black text-slate-950 tracking-tight">Active Encounters</h2>
                  <Button variant="ghost" onClick={() => navigate('/doctors')} className="text-orange-600 font-black text-xs uppercase tracking-widest gap-2">
                     <Plus className="w-4 h-4" /> Book Protocol
                  </Button>
               </div>

               <div className="grid gap-6">
                 {loading ? (
                   [1, 2].map(i => <Skeleton key={i} className="h-40 rounded-[2.5rem] bg-slate-50" />)
                 ) : upcomingAppointments.length > 0 ? (
                   upcomingAppointments.map((apt, idx) => (
                     <motion.div
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: idx * 0.1 }}
                       key={apt.id}
                       onClick={() => navigate(`/appointments/${apt.id}`)}
                       className="group bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-8 hover:shadow-2xl hover:border-orange-100 transition-all cursor-pointer relative overflow-hidden"
                     >
                       <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[4rem] group-hover:bg-orange-50 transition-colors" />
                       
                       <div className="w-20 h-20 rounded-2xl bg-slate-950 flex flex-col items-center justify-center text-white shadow-xl flex-shrink-0 relative z-10">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{format(parseISO(apt.appointment_date), 'MMM')}</span>
                          <span className="text-3xl font-black tracking-tighter">{format(parseISO(apt.appointment_date), 'dd')}</span>
                       </div>

                       <div className="flex-1 space-y-4 relative z-10">
                          <div className="flex flex-wrap items-center gap-3">
                             <h3 className="text-2xl font-black text-slate-950 tracking-tight">{apt.doctor?.full_name}</h3>
                             <Badge className={`${getStatusStyle(apt.status)} border px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest`}>
                                {apt.status}
                             </Badge>
                             {isToday(parseISO(apt.appointment_date)) && (
                               <Badge className="bg-orange-600 text-white font-black text-[9px] uppercase tracking-widest rounded-full">Today</Badge>
                             )}
                          </div>
                          <div className="flex flex-wrap gap-6">
                             <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                <Clock className="w-4 h-4 text-orange-500" /> {apt.appointment_time}
                             </div>
                             <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                {apt.consultation_type === 'home_visit' ? <Home className="w-4 h-4 text-red-500" /> : <MapPin className="w-4 h-4 text-blue-500" />}
                                {apt.consultation_type.replace('_', ' ').toUpperCase()}
                             </div>
                             <div className="flex items-center gap-2 text-orange-600 font-black text-sm">
                                ₹{apt.payment_amount}
                             </div>
                          </div>
                       </div>
                       
                       <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                          <ChevronRight className="w-6 h-6" />
                       </div>
                     </motion.div>
                   ))
                 ) : (
                   <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                      <Calendar className="w-16 h-16 mx-auto text-slate-200" />
                      <h3 className="text-2xl font-black text-slate-950 tracking-tight">System Idle</h3>
                      <p className="text-slate-400 font-bold text-sm italic">"No active clinical encounters scheduled at this phase."</p>
                      <Button onClick={() => navigate('/doctors')} className="bg-slate-950 text-white rounded-xl px-8 py-4 font-black">Book Encounter</Button>
                   </div>
                 )}
               </div>
            </div>

            {/* FEATURED CAMPAIGNS */}
            {ads.length > 0 && (
              <div className="space-y-8">
                 <h2 className="text-3xl font-black text-slate-950 tracking-tight">Clinical Insights</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {ads.slice(0, 2).map((ad, i) => (
                     <motion.div 
                      whileHover={{ scale: 1.02 }}
                      key={i} 
                      className="group bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl cursor-pointer"
                      onClick={() => ad.redirect_url && window.open(ad.redirect_url, '_blank')}
                     >
                       <div className="h-48 relative overflow-hidden">
                          <img src={ad.image_url} alt="Ad" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                          <div className="absolute inset-0 bg-slate-950/20" />
                          <Badge className="absolute top-6 right-6 bg-white/90 backdrop-blur text-slate-950 font-black text-[8px] uppercase tracking-widest px-3 py-1.5 rounded-lg border-none shadow-lg">Partner Content</Badge>
                       </div>
                       <CardContent className="p-8 space-y-2">
                          <h3 className="text-xl font-black text-slate-950 tracking-tight line-clamp-1">{ad.title}</h3>
                          <p className="text-slate-500 font-bold text-sm line-clamp-2 leading-relaxed opacity-80">{ad.description}</p>
                       </CardContent>
                     </motion.div>
                   ))}
                 </div>
              </div>
            )}
          </div>

          {/* SIDEBAR CALENDAR */}
          <aside className="lg:col-span-4 space-y-12">
             <Card className="bg-white border-slate-100 rounded-[3rem] p-8 shadow-xl">
                <CardHeader className="p-0 mb-8 flex flex-row items-center gap-4">
                   <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5 text-orange-600" /></div>
                   <CardTitle className="text-2xl font-black text-slate-950 tracking-tight">Cycle Log</CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col items-center">
                   <CalendarUI
                     mode="single"
                     selected={selectedDate}
                     onSelect={(date) => date && setSelectedDate(date)}
                     modifiers={{
                       hasAppointment: appointments.map(apt => parseISO(apt.appointment_date))
                     }}
                     modifiersStyles={{
                       hasAppointment: { border: '2px solid #f97316', borderRadius: '12px', fontWeight: '900', color: '#f97316' }
                     }}
                     className="rounded-[2rem] border-none shadow-sm w-full p-4"
                   />
                </CardContent>
             </Card>

             <Card className="bg-slate-950 rounded-[3rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 mesh-orange-red opacity-10" />
                <div className="relative z-10 space-y-8">
                   <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg"><TrendingUp className="w-7 h-7 text-white" /></div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black text-white tracking-tight leading-none">Global Network</h3>
                      <p className="text-slate-500 font-bold text-xs italic">"Join 50k+ elite members in our secure clinical ecosystem."</p>
                   </div>
                   <Button onClick={() => navigate('/doctors')} className="w-full bg-white text-slate-950 rounded-2xl py-6 font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-xl">Expand Care Matrix</Button>
                </div>
             </Card>
          </aside>
        </div>
      </main>

      <MobileNav />
      <Footer />
    </div>
  );
}
