import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, MobileNav, Footer } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Bell,
  ArrowRight,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  Settings,
  Plus,
  X,
  Home,
  TrendingUp,
  Shield,
  Activity,
  ChevronRight,
  Briefcase,
  Zap
} from 'lucide-react';
import { Calendar as CalendarUI } from '../components/ui/calendar';
import axios from 'axios';
import { format, parseISO, isToday, isTomorrow, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function DoctorDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [holidays, setHolidays] = useState([]);
  const [workingHours, setWorkingHours] = useState({
    monday: { active: true, slots: [{ start: '09:00', end: '17:00' }] },
    tuesday: { active: true, slots: [{ start: '09:00', end: '17:00' }] },
    wednesday: { active: true, slots: [{ start: '09:00', end: '17:00' }] },
    thursday: { active: true, slots: [{ start: '09:00', end: '17:00' }] },
    friday: { active: true, slots: [{ start: '09:00', end: '17:00' }] },
    saturday: { active: false, slots: [{ start: '10:00', end: '14:00' }] },
    sunday: { active: false, slots: [{ start: '10:00', end: '14:00' }] }
  });
  const [savingHolidays, setSavingHolidays] = useState(false);

  useEffect(() => {
    fetchData();
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const holidayRes = await axios.get(`${API_URL}/api/doctors/holidays`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (holidayRes.data.holidays) {
        setHolidays(holidayRes.data.holidays.map(d => parseISO(d)));
      }

      const hoursRes = await axios.get(`${API_URL}/api/doctors/working-hours`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (hoursRes.data.working_hours && Object.keys(hoursRes.data.working_hours).length > 0) {
        setWorkingHours(hoursRes.data.working_hours);
      }
    } catch (error) {
      console.error('Error fetching schedules', error);
    }
  };

  const handleSaveHolidays = async () => {
    setSavingHolidays(true);
    try {
      const formattedHolidays = holidays.map(date => format(date, 'yyyy-MM-dd'));

      await Promise.all([
        axios.put(`${API_URL}/api/doctors/holidays`, { holidays: formattedHolidays }, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.put(`${API_URL}/api/doctors/working-hours`, { working_hours: workingHours }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      toast.success('Clinical availability configurations updated.');
    } catch (error) {
      toast.error('Failed to update clinical schedule.');
    } finally {
      setSavingHolidays(false);
    }
  };

  const toggleHoliday = (day) => {
    if (!day) return;
    const isAlreadyHoliday = holidays.some(h => isSameDay(h, day));
    if (isAlreadyHoliday) {
      setHolidays(holidays.filter(h => !isSameDay(h, day)));
    } else {
      setHolidays([...holidays, day]);
    }
  };

  const fetchData = async () => {
    try {
      const [appointmentsRes, profileRes] = await Promise.all([
        axios.get(`${API_URL}/api/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/doctors/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null)
      ]);

      setAppointments(appointmentsRes.data.appointments || []);
      setDoctorProfile(profileRes?.data);

      if (!profileRes?.data?.license_number) {
        navigate('/doctor/onboarding');
      }
    } catch (error) {
      console.error('Error fetching clinical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      await axios.put(
        `${API_URL}/api/appointments/${appointmentId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Clinical encounter ${status}.`);
      fetchData();
    } catch (error) {
      console.error('Error updating encounter:', error);
      toast.error('Clinical protocol update failed.');
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

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');
  const todayAppointments = appointments.filter(apt => isToday(parseISO(apt.appointment_date)) && ['pending', 'confirmed'].includes(apt.status));

  if (!doctorProfile?.is_verified && doctorProfile?.license_number) {
    return (
      <div className="min-h-screen bg-[#fcfdfd]">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-32 text-center space-y-8">
          <div className="w-24 h-24 rounded-[2rem] bg-orange-50 flex items-center justify-center mx-auto shadow-xl border border-orange-100">
            <Shield className="w-12 h-12 text-orange-600 animate-pulse" />
          </div>
          <div className="space-y-4">
             <h1 className="text-4xl font-black text-slate-950 tracking-tighter">Credential Verification in Progress.</h1>
             <p className="text-slate-400 font-bold text-lg italic max-w-lg mx-auto">
               "Your clinical credentials are being verified against global standards. You will be notified once access is granted."
             </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/settings')} className="rounded-2xl px-10 py-6 border-slate-200 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
            Review Profile Data
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden scale-[0.95] origin-top pb-24 md:pb-0">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        
        {/* ELITE PROFESSIONAL HEADER */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-slate-950 rounded-[3.5rem] p-12 md:p-16 border border-white/5 shadow-2xl overflow-hidden mb-12"
        >
          <div className="absolute inset-0 mesh-orange-red opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4 text-center md:text-left">
               <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-1.5 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-400 text-[10px] font-black uppercase tracking-widest">Clinical Authority Verified</span>
               </div>
               <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
                 Dr. {user?.full_name?.split(' ')[0]}.
               </h1>
               <p className="text-slate-400 text-lg font-bold italic border-l-2 border-orange-500/30 pl-5">
                 "Orchestrating clinical excellence across your professional practice."
               </p>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
               <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <span className="text-xl font-black text-white tracking-tight">₹{(appointments.filter(a => a.status === 'completed').reduce((acc, curr) => acc + (curr.payment_amount || 0), 0)).toLocaleString()}</span>
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Cumulative Revenue</span>
            </div>
          </div>
        </motion.section>

        {/* CLINICAL METRICS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Pending Phase', value: pendingAppointments.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Active Roster', value: confirmedAppointments.length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Today Window', value: todayAppointments.length, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Consult Fee', value: `₹${doctorProfile?.consultation_fee || 0}`, icon: IndianRupee, color: 'text-red-500', bg: 'bg-red-50' }
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

        {/* MAIN DASHBOARD MATRIX */}
        <div className="grid lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-8 space-y-12">
             
             {/* TABS FOR APPOINTMENTS */}
             <Tabs defaultValue="pending" className="space-y-10">
                <TabsList className="bg-slate-50 p-2 rounded-[2.5rem] border border-slate-100 flex gap-2">
                   {['pending', 'confirmed', 'completed', 'settings'].map((val) => (
                      <TabsTrigger 
                        key={val} 
                        value={val} 
                        className="flex-1 rounded-[1.8rem] py-4 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-orange-600 transition-all flex items-center justify-center gap-3"
                      >
                        {val === 'settings' ? 'Protocol Control' : val}
                        {val === 'pending' && pendingAppointments.length > 0 && <Badge className="bg-orange-600 text-white rounded-full px-2 py-0.5 text-[8px]">{pendingAppointments.length}</Badge>}
                      </TabsTrigger>
                   ))}
                </TabsList>

                {/* PENDING APPOINTMENTS */}
                <TabsContent value="pending" className="space-y-8 focus:outline-none">
                   {loading ? (
                     [1, 2].map(i => <Skeleton key={i} className="h-40 rounded-[2.5rem] bg-slate-50" />)
                   ) : pendingAppointments.length > 0 ? (
                     pendingAppointments.map((apt) => (
                       <motion.div key={apt.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-8 hover:shadow-2xl transition-all group">
                          <div className="w-20 h-20 rounded-2xl bg-slate-50 flex flex-col items-center justify-center font-black text-orange-600 shadow-sm border border-slate-100">
                             <span className="text-[10px] uppercase opacity-50">{format(parseISO(apt.appointment_date), 'MMM')}</span>
                             <span className="text-3xl tracking-tighter">{format(parseISO(apt.appointment_date), 'dd')}</span>
                          </div>
                          <div className="flex-1 space-y-3">
                             <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-2xl font-black text-slate-950 tracking-tight">{apt.patient?.full_name || 'Clinical Subject'}</h3>
                                <Badge className="bg-amber-500/10 text-amber-600 border border-amber-200 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">Encounter Pending</Badge>
                             </div>
                             <div className="flex flex-wrap gap-6 text-slate-500 font-bold text-sm">
                                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> {apt.appointment_time}</span>
                                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" /> {apt.consultation_type.replace('_', ' ').toUpperCase()}</span>
                             </div>
                          </div>
                          <div className="flex gap-3">
                             <Button onClick={() => handleStatusUpdate(apt.id, 'confirmed')} className="bg-slate-950 text-white rounded-xl px-8 py-6 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95">Authorize</Button>
                             <Button onClick={() => handleStatusUpdate(apt.id, 'cancelled')} variant="ghost" className="text-slate-400 hover:text-red-600 font-black text-[10px] uppercase tracking-widest">Discard</Button>
                          </div>
                       </motion.div>
                     ))
                   ) : (
                     <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-6">
                        <Activity className="w-16 h-16 mx-auto text-slate-200" />
                        <h3 className="text-2xl font-black text-slate-950 tracking-tight">Roster Synchronized</h3>
                        <p className="text-slate-400 font-bold text-sm italic">"No pending clinical encounters at this phase."</p>
                     </div>
                   )}
                </TabsContent>

                {/* CONFIRMED APPOINTMENTS */}
                <TabsContent value="confirmed" className="space-y-8 focus:outline-none">
                   {confirmedAppointments.map((apt) => (
                     <motion.div key={apt.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} onClick={() => navigate(`/appointments/${apt.id}`)} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-8 hover:shadow-2xl transition-all cursor-pointer group">
                        <div className="w-20 h-20 rounded-2xl bg-slate-950 text-white flex flex-col items-center justify-center font-black shadow-xl">
                           <span className="text-[10px] uppercase opacity-50">{format(parseISO(apt.appointment_date), 'MMM')}</span>
                           <span className="text-3xl tracking-tighter">{format(parseISO(apt.appointment_date), 'dd')}</span>
                        </div>
                        <div className="flex-1 space-y-3">
                           <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-2xl font-black text-slate-950 tracking-tight">{apt.patient?.full_name}</h3>
                              <Badge className="bg-green-500/10 text-green-600 border border-green-200 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">Protocol Authorized</Badge>
                           </div>
                           <div className="flex flex-wrap gap-6 text-slate-500 font-bold text-sm">
                              <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" /> {apt.appointment_time}</span>
                              <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" /> {apt.consultation_type.replace('_', ' ').toUpperCase()}</span>
                           </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                           <ChevronRight className="w-6 h-6" />
                        </div>
                     </motion.div>
                   ))}
                </TabsContent>

                {/* SETTINGS / AVAILABILITY */}
                <TabsContent value="settings" className="focus:outline-none">
                   <div className="grid lg:grid-cols-[1.2fr,1fr] gap-12">
                      <Card className="bg-white border-slate-100 rounded-[3rem] p-10 shadow-xl space-y-10">
                         <div className="space-y-2">
                            <h3 className="text-3xl font-black text-slate-950 tracking-tight">Operational Cycle</h3>
                            <p className="text-slate-400 font-bold text-xs italic">"Define your recurring professional standard hours."</p>
                         </div>
                         <div className="space-y-4">
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                               const dayData = workingHours[day] || { active: false, slots: [] };
                               return (
                                 <div key={day} className="flex flex-col p-6 border border-slate-100 rounded-[2rem] bg-slate-50/50 hover:bg-white hover:shadow-lg transition-all group">
                                    <div className="flex items-center justify-between mb-4">
                                       <label className="flex items-center gap-4 cursor-pointer">
                                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${dayData.active ? 'bg-orange-600 border-orange-600' : 'border-slate-200'}`}>
                                             {dayData.active && <CheckCircle className="w-4 h-4 text-white" />}
                                          </div>
                                          <input 
                                            type="checkbox" 
                                            className="sr-only" 
                                            checked={dayData.active}
                                            onChange={(e) => setWorkingHours(prev => ({
                                              ...prev, [day]: { ...(prev[day] || { slots: [{ start: '09:00', end: '17:00' }] }), active: e.target.checked }
                                            }))}
                                          />
                                          <span className="text-sm font-black text-slate-950 uppercase tracking-widest">{day}</span>
                                       </label>
                                       {dayData.active && (
                                          <button onClick={() => {
                                            const newSlots = [...(Array.isArray(dayData.slots) ? dayData.slots : []), { start: '09:00', end: '17:00' }];
                                            setWorkingHours(prev => ({ ...prev, [day]: { ...(prev[day] || {}), slots: newSlots } }));
                                          }} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-600 border border-slate-100 shadow-sm hover:scale-110 transition-all"><Plus className="w-5 h-5" /></button>
                                       )}
                                    </div>
                                    {dayData.active && (
                                       <div className="space-y-3">
                                          {dayData.slots.map((slot, idx) => (
                                             <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                                                <input type="time" value={slot.start} onChange={(e) => {
                                                  const newSlots = [...dayData.slots];
                                                  newSlots[idx] = { ...newSlots[idx], start: e.target.value };
                                                  setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], slots: newSlots } }));
                                                }} className="bg-slate-50 border-none rounded-xl px-4 py-2 font-black text-xs text-slate-900 focus:ring-2 focus:ring-orange-500/10" />
                                                <span className="text-slate-300 font-black text-[10px]">TO</span>
                                                <input type="time" value={slot.end} onChange={(e) => {
                                                  const newSlots = [...dayData.slots];
                                                  newSlots[idx] = { ...newSlots[idx], end: e.target.value };
                                                  setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], slots: newSlots } }));
                                                }} className="bg-slate-50 border-none rounded-xl px-4 py-2 font-black text-xs text-slate-900 focus:ring-2 focus:ring-orange-500/10" />
                                                {dayData.slots.length > 1 && (
                                                   <button onClick={() => {
                                                      const newSlots = dayData.slots.filter((_, i) => i !== idx);
                                                      setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], slots: newSlots } }));
                                                   }} className="ml-auto text-slate-300 hover:text-red-600 transition-colors"><X className="w-5 h-5" /></button>
                                                )}
                                             </div>
                                          ))}
                                       </div>
                                    )}
                                 </div>
                               )
                            })}
                         </div>
                      </Card>

                      <div className="space-y-12">
                         <Card className="bg-white border-slate-100 rounded-[3rem] p-10 shadow-xl space-y-8">
                            <div className="space-y-2">
                               <h3 className="text-3xl font-black text-slate-950 tracking-tight">Phase Off Duty</h3>
                               <p className="text-slate-400 font-bold text-xs italic">"Select clinical rest periods/holidays."</p>
                            </div>
                            <div className="flex justify-center scale-110 py-6">
                               <CalendarUI mode="multiple" selected={holidays} onSelect={(days) => setHolidays(days || [])} className="rounded-3xl border-none shadow-sm" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                               {holidays.sort((a,b)=>a-b).map((h, i) => (
                                 <Badge key={i} className="bg-slate-950 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-2">
                                   {format(h, 'dd MMM')} <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => toggleHoliday(h)} />
                                 </Badge>
                               ))}
                            </div>
                         </Card>

                         <Button onClick={handleSaveHolidays} disabled={savingHolidays} className="w-full bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-[2rem] py-8 text-xl font-black shadow-2xl active:scale-95 transition-all shimmer-btn">
                            {savingHolidays ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Deploy Configuration"}
                         </Button>
                      </div>
                   </div>
                </TabsContent>
             </Tabs>
          </div>

          {/* SIDEBAR ANALYTICS */}
          <aside className="lg:col-span-4 space-y-12">
             <Card className="bg-white border-slate-100 rounded-[3rem] p-8 shadow-xl">
                <CardHeader className="p-0 mb-8 flex flex-row items-center gap-4">
                   <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"><Calendar className="w-5 h-5 text-orange-600" /></div>
                   <CardTitle className="text-2xl font-black text-slate-950 tracking-tight">Daily Matrix</CardTitle>
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
                <div className="relative z-10 space-y-8 text-center">
                   <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10 shadow-2xl group-hover:rotate-12 transition-transform duration-500"><Zap className="w-8 h-8 text-orange-500" /></div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black text-white tracking-tight leading-none">Clinical Elite Support</h3>
                      <p className="text-slate-500 font-bold text-[10px] italic leading-relaxed">"Need assistance with practice management? Our clinical support team is active 24/7."</p>
                   </div>
                   <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl py-6 font-black uppercase text-[10px] tracking-widest transition-all shadow-xl">Secure Support Channel</Button>
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
