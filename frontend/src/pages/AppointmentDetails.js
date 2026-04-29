import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, MobileNav, Footer } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  ChevronLeft,
  Video,
  MapPin,
  Clock,
  Calendar,
  MessageSquare,
  Send,
  X,
  Check,
  AlertCircle,
  CreditCard,
  Loader2,
  Paperclip,
  Star,
  Home,
  Shield,
  Zap,
  ChevronRight,
  Activity,
  User,
  Download,
  Share2
} from 'lucide-react';
import axios from 'axios';
import { format, parseISO, isToday } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import AudioCallWidget from '../components/AudioCallWidget';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AppointmentDetails() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAppointment();

    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      handlePaymentSuccess(sessionId);
    } else if (paymentStatus === 'cancelled') {
      toast.info('Clinical transaction cancelled by user.');
    }
  }, [appointmentId]);

  useEffect(() => {
    if (appointment) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [appointment]);

  useEffect(() => {
    if (appointment && appointment.status === 'completed' && user?.role === 'patient') {
      fetchCanReview();
    }
  }, [appointment, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAppointment = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointment(response.data);
    } catch (error) {
      console.error('Error fetching clinical encounter:', error);
      toast.error('Encounter data not found.');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/appointments/${appointmentId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching communications:', error);
    }
  };

  const handlePaymentSuccess = async (sessionId) => {
    try {
      const response = await axios.get(`${API_URL}/api/payments/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment_status === 'paid') {
        toast.success('Clinical transaction successful. Channel synchronized.');
        fetchAppointment();
      }
    } catch (error) {
      console.error('Error verifying transaction:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;

    setSending(true);
    try {
      await axios.post(
        `${API_URL}/api/appointments/${appointmentId}/messages`,
        { message: newMessage, file_url: attachment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
      setAttachment(null);
      fetchMessages();
    } catch (error) {
      console.error('Error transmitting message:', error);
      toast.error('Message transmission failed.');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Clinical attachments must be under 10MB.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await axios.post(`${API_URL}/api/chat/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setAttachment(response.data.file_url);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Clinical file upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchCanReview = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/doctors/${appointment.doctor_id}/can-review`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.can_review && data.appointment_id === appointmentId) setCanReview(true);
    } catch (error) { console.error('Error fetching review eligibility', error); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await axios.post(
        `${API_URL}/api/doctors/${appointment.doctor_id}/reviews`,
        {
          doctor_id: appointment.doctor_id,
          appointment_id: appointment.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Clinical outcome testimony submitted.');
      setCanReview(false);
    } catch (error) {
      console.error('Error submitting testimony:', error);
      toast.error('Synthesis failed. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      await axios.put(
        `${API_URL}/api/appointments/${appointmentId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Encounter phase updated to ${status}.`);
      fetchAppointment();
    } catch (error) {
      console.error('Error updating encounter:', error);
      toast.error('Failed to update clinical protocol.');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Initialize encounter cancellation protocol?')) return;

    try {
      await axios.post(
        `${API_URL}/api/appointments/${appointmentId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Clinical encounter cancelled.');
      fetchAppointment();
    } catch (error) {
      console.error('Error cancelling encounter:', error);
      toast.error('Cancellation failed.');
    }
  };

  const handleJoinCall = () => {
    if (appointment.jitsi_room_id) {
       navigate(`/telehealth/${appointment.jitsi_room_id}`);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      pending: 'bg-amber-500/10 text-amber-600 border-amber-200',
      confirmed: 'bg-green-500/10 text-green-600 border-green-200',
      completed: 'bg-blue-500/10 text-blue-600 border-blue-200',
      cancelled: 'bg-red-500/10 text-red-600 border-red-200',
      no_show: 'bg-slate-100 text-slate-600 border-slate-200'
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

  if (!appointment) return null;

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';
  const canJoinCall = appointment.consultation_type === 'telehealth' &&
    appointment.status === 'confirmed' &&
    appointment.jitsi_room_id;

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden scale-[0.95] origin-top pb-24 md:pb-0">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-24">
        
        {/* ELITE ENCOUNTER HEADER */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-slate-950 rounded-[3.5rem] p-12 md:p-16 border border-white/5 shadow-2xl overflow-hidden mb-12"
        >
          <div className="absolute inset-0 mesh-orange-red opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-10">
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <Button variant="ghost" onClick={() => navigate(-1)} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 flex items-center justify-center">
                     <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <div>
                     <p className="text-orange-500 font-black text-[10px] uppercase tracking-[0.4em] mb-1">Encounter Protocol</p>
                     <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                        Ref: #{appointment.hex_reference || appointment.id.split('-')[0].toUpperCase()}
                     </h1>
                  </div>
               </div>
               <div className="flex flex-wrap gap-3">
                  <Badge className={`${getStatusStyle(appointment.status)} border px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest`}>
                    {appointment.status}
                  </Badge>
                  <Badge className="bg-white/5 border border-white/10 text-slate-300 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
                    {appointment.payment_status === 'paid' ? 'Transaction: Confirmed' : 'Transaction: ' + appointment.payment_status.toUpperCase()}
                  </Badge>
                  {appointment.appointment_date && isToday(parseISO(appointment.appointment_date)) && (
                    <Badge className="bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full animate-pulse">Critical: Today</Badge>
                  )}
               </div>
            </div>
            
            <div className="flex flex-col md:items-end gap-4">
               {isDoctor && appointment.status === 'pending' && (
                 <div className="flex gap-3">
                    <Button onClick={() => handleStatusUpdate('confirmed')} className="bg-white text-slate-950 rounded-2xl px-8 py-6 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl">Authorize</Button>
                    <Button onClick={() => handleStatusUpdate('cancelled')} className="bg-red-600/10 text-red-500 border border-red-500/20 rounded-2xl px-8 py-6 font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Decline</Button>
                 </div>
               )}
               {isDoctor && appointment.status === 'confirmed' && (
                  <Button onClick={() => handleStatusUpdate('completed')} className="bg-green-600 text-white rounded-2xl px-8 py-6 font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Finalize Synthesis</Button>
               )}
               {isPatient && ['pending', 'confirmed'].includes(appointment.status) && (
                  <Button onClick={handleCancel} className="bg-white/5 text-slate-400 border border-white/10 rounded-2xl px-8 py-6 font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Abort Protocol</Button>
               )}
            </div>
          </div>
        </motion.section>

        <div className="grid lg:grid-cols-[1fr,400px] gap-12 items-start">
          
          {/* COMMUNICATION & DATA HUB */}
          <div className="space-y-12">
            
            {/* Encounter Parameters */}
            <div className="grid md:grid-cols-2 gap-6">
               <Card className="bg-white border-slate-100 rounded-[2.5rem] p-8 shadow-xl flex items-center gap-6">
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                     <Calendar className="w-7 h-7" />
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phase Date</p>
                     <p className="font-black text-slate-900 tracking-tight">{format(parseISO(appointment.appointment_date), 'EEEE, MMM dd, yyyy')}</p>
                  </div>
               </Card>
               <Card className="bg-white border-slate-100 rounded-[2.5rem] p-8 shadow-xl flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                     <Clock className="w-7 h-7" />
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Access Time</p>
                     <p className="font-black text-slate-900 tracking-tight">{appointment.appointment_time}</p>
                  </div>
               </Card>
               <Card className="bg-white border-slate-100 rounded-[2.5rem] p-8 shadow-xl flex items-center gap-6">
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 shadow-sm">
                     {appointment.consultation_type === 'home_visit' ? <Home className="w-7 h-7" /> : <MapPin className="w-7 h-7" />}
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Modality</p>
                     <p className="font-black text-slate-900 tracking-tight uppercase">{appointment.consultation_type.replace('_', ' ')}</p>
                  </div>
               </Card>
               <Card className="bg-white border-slate-100 rounded-[2.5rem] p-8 shadow-xl flex items-center gap-6">
                  <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-sm">
                     <IndianRupee className="w-7 h-7" />
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol Fee</p>
                     <p className="font-black text-slate-900 tracking-tight">₹{appointment.payment_amount}</p>
                  </div>
               </Card>
            </div>

            {/* Clinical Messaging Hub */}
            <Card className="bg-white border-slate-100 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col h-[700px]">
               <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center shadow-lg"><MessageSquare className="w-6 h-6 text-white" /></div>
                     <div>
                        <CardTitle className="text-2xl font-black text-slate-950 tracking-tighter">Clinical Messenger</CardTitle>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Encrypted Direct Channel</p>
                     </div>
                  </div>
                  <div className="hidden md:block w-72">
                     <AudioCallWidget appointmentId={appointmentId} currentUserId={user?.id} />
                  </div>
               </CardHeader>
               
               <CardContent className="flex-1 p-0 flex flex-col bg-slate-50/30">
                  <ScrollArea className="flex-1 p-8">
                     <div className="space-y-8">
                        {messages.length > 0 ? (
                           messages.map((msg, i) => (
                             <motion.div
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               key={msg.id}
                               className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                             >
                               <div className={`max-w-[75%] space-y-2`}>
                                  <div className={`px-6 py-4 rounded-[2rem] shadow-sm relative ${msg.sender_id === user?.id
                                    ? 'bg-orange-600 text-white rounded-br-none font-bold text-sm'
                                    : 'bg-white text-slate-900 border border-slate-100 rounded-bl-none font-medium text-sm shadow-md'
                                    }`}>
                                     {msg.file_url && (
                                       <div className="mb-4 rounded-2xl overflow-hidden border border-white/20 group relative cursor-pointer" onClick={() => window.open(`${API_URL}${msg.file_url}`, '_blank')}>
                                          <img src={`${API_URL}${msg.file_url}`} alt="Clinical Attachment" className="w-full h-48 object-cover group-hover:scale-110 transition-transform" />
                                          <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                             <Download className="w-8 h-8 text-white" />
                                          </div>
                                       </div>
                                     )}
                                     {msg.message && <p className="leading-relaxed">{msg.message}</p>}
                                  </div>
                                  <p className={`text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 ${msg.sender_id === user?.id ? 'text-right' : 'text-left'}`}>
                                     {msg.sender_name} • {format(parseISO(msg.created_at), 'HH:mm')}
                                  </p>
                               </div>
                             </motion.div>
                           ))
                        ) : (
                           <div className="text-center py-20 space-y-6">
                              <Zap className="w-16 h-16 mx-auto text-slate-100" />
                              <p className="text-slate-400 font-bold text-sm italic">"Initialize secure clinical communication."</p>
                           </div>
                        )}
                        <div ref={messagesEndRef} />
                     </div>
                  </ScrollArea>

                  {/* Attachment Preview */}
                  <AnimatePresence>
                    {attachment && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="px-8 py-4 bg-orange-50 border-t border-orange-100 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl border border-orange-200 overflow-hidden">
                               <img src={`${API_URL}${attachment}`} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Attachment Ready</p>
                         </div>
                         <button onClick={() => setAttachment(null)} className="w-8 h-8 bg-white rounded-full border border-orange-100 flex items-center justify-center text-red-500 shadow-sm"><X className="w-4 h-4" /></button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Input Matrix */}
                  <div className="p-8 bg-white border-t border-slate-50">
                     <form onSubmit={sendMessage} className="flex gap-4">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                        <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={uploading || sending} className="w-16 h-16 rounded-2xl bg-slate-50 hover:bg-orange-50 hover:text-orange-600 transition-all">
                           {uploading ? <Loader2 className="w-6 h-6 animate-spin text-orange-600" /> : <Paperclip className="w-6 h-6" />}
                        </Button>
                        <div className="flex-1 relative">
                           <input
                              placeholder="Draft clinical message..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              disabled={sending || uploading}
                              className="w-full h-16 bg-slate-50 border border-slate-100 rounded-2xl px-8 font-bold text-sm focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all pr-16"
                           />
                           <Button type="submit" disabled={sending || uploading || (!newMessage.trim() && !attachment)} className="absolute right-2 top-2 h-12 w-12 bg-slate-950 hover:bg-orange-600 text-white rounded-xl shadow-lg transition-all active:scale-95">
                              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                           </Button>
                        </div>
                     </form>
                  </div>
               </CardContent>
            </Card>
          </div>

          {/* SIDEBAR PARTICIPANTS */}
          <aside className="space-y-10 sticky top-24">
            
            {/* Participant Card */}
            <Card className="bg-white border-slate-100 rounded-[3rem] p-10 shadow-xl space-y-8">
               <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isPatient ? 'Lead Specialist' : 'Clinical Subject'}</p>
                  <h3 className="text-2xl font-black text-slate-950 tracking-tight">{isPatient ? 'Lead Physician' : 'Verified Subject'}</h3>
               </div>
               
               <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center font-black text-white shadow-xl relative overflow-hidden">
                     {isPatient && appointment.doctor?.profile_image ? (
                       <img src={appointment.doctor.profile_image} alt="Doctor" className="w-full h-full object-cover" />
                     ) : (
                       <span className="text-xl">{(isPatient ? appointment.doctor?.full_name : appointment.patient?.full_name)?.charAt(0)}</span>
                     )}
                  </div>
                  <div>
                     <p className="font-black text-slate-900 tracking-tight">{isPatient ? (appointment.doctor?.title + ' ' + appointment.doctor?.full_name) : appointment.patient?.full_name}</p>
                     <p className="text-[9px] font-black text-orange-600 uppercase tracking-widest">{isPatient ? (appointment.doctor?.specialties?.[0] || 'Clinical Elite') : 'Patient Entity'}</p>
                  </div>
               </div>

               {appointment.family_member && (
                 <div className="p-6 bg-orange-50/50 rounded-[2rem] border border-orange-100 space-y-2">
                    <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Secondary Subject</p>
                    <p className="font-black text-slate-900">{appointment.family_member.full_name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Relationship: {appointment.family_member.relationship}</p>
                 </div>
               )}
            </Card>

            {/* CALL PROTOCOL */}
            {canJoinCall && (
               <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-[3rem] text-white text-center space-y-6 shadow-2xl">
                  <Video className="w-12 h-12 mx-auto mb-2 text-white animate-pulse" />
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black tracking-tight leading-none">Remote Synthesis Active</h3>
                     <p className="text-white/70 font-bold text-xs italic">"Join the secure clinical video channel."</p>
                  </div>
                  <Button onClick={handleJoinCall} className="w-full bg-white text-orange-600 hover:bg-orange-50 rounded-2xl py-8 font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all shimmer-btn">
                     Join Call Interface
                  </Button>
               </motion.div>
            )}

            {/* TESTIMONY PROTOCOL */}
            {canReview && (
              <Card className="bg-white border-slate-100 rounded-[3rem] p-10 shadow-xl space-y-8">
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-950 tracking-tight">Clinical Outcome</h3>
                    <p className="text-slate-400 font-bold text-xs italic">"Submit your testimony for this encounter."</p>
                 </div>
                 <form onSubmit={submitReview} className="space-y-6">
                    <div className="flex justify-around">
                       {[1, 2, 3, 4, 5].map((star) => (
                         <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })} className="focus:outline-none transform hover:scale-125 transition-all">
                           <Star className={`w-8 h-8 ${star <= reviewForm.rating ? 'fill-orange-500 text-orange-500' : 'text-slate-200'}`} />
                         </button>
                       ))}
                    </div>
                    <Textarea 
                      value={reviewForm.comment} 
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Draft clinical observations..."
                      className="rounded-2xl bg-slate-50 border-slate-100 font-bold p-6 min-h-[120px]"
                      required
                    />
                    <Button type="submit" disabled={submittingReview} className="w-full bg-slate-950 text-white rounded-2xl py-6 font-black uppercase text-[10px] tracking-widest shadow-xl">
                       {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Testimony'}
                    </Button>
                 </form>
              </Card>
            )}

            {/* TRUST WIDGET */}
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center gap-4">
               <Shield className="w-8 h-8 text-orange-600" />
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  Clinical encounter governed by <br /> HD SECURE PROTOCOLS 4.0
               </p>
            </div>
          </aside>
        </div>
      </main>

      <MobileNav />
      <Footer />
    </div>
  );
}
