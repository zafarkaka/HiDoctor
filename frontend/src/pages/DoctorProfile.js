import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, Footer } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
import { Textarea } from '../components/ui/textarea';
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Mail,
  Award,
  Languages,
  Shield,
  MessageSquare,
  ChevronLeft,
  CheckCircle,
  Home,
  Video,
  ArrowRight,
  Stethoscope,
  CalendarDays,
  Zap,
  TrendingUp,
  Heart
} from 'lucide-react';
import axios from 'axios';
import { format, parseISO, isSameDay } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [canReview, setCanReview] = useState(false);
  const [reviewAppointmentId, setReviewAppointmentId] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetchDoctor();
    fetchReviews();
    fetchAds();
    if (isAuthenticated) {
      fetchCanReview();
    }
  }, [doctorId, isAuthenticated]);

  const fetchCanReview = async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/doctors/${doctorId}/can-review`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.can_review) {
        setCanReview(true);
        setReviewAppointmentId(data.appointment_id);
      }
    } catch (error) {
      console.error('Error fetching review eligibility', error);
    }
  };

  const fetchAds = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/campaigns?placement=clinic`);
      setAds(response.data.ads || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const handleAdClick = async (ad) => {
    try {
      await axios.post(`${API_URL}/api/campaigns/${ad.id}/click`);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
    if (ad.redirect_url) window.open(ad.redirect_url, '_blank');
  };

  const fetchDoctor = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/doctors/${doctorId}`);
      setDoctor(response.data);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      toast.error('Doctor not found');
      navigate('/doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/doctors/${doctorId}/reviews`);
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewFormData.rating) return;
    setSubmittingReview(true);
    try {
      await axios.post(
        `${API_URL}/api/doctors/${doctorId}/reviews`,
        {
          doctor_id: doctorId,
          appointment_id: reviewAppointmentId,
          rating: reviewFormData.rating,
          comment: reviewFormData.comment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setCanReview(false);
      fetchReviews();
      fetchDoctor();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      toast.info('Please login to book an appointment');
      navigate('/login', { state: { from: { pathname: `/booking/${doctorId}` } } });
      return;
    }
    navigate(`/booking/${doctorId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfdfd]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <Skeleton className="h-[400px] w-full mb-12 rounded-[3rem] bg-slate-100" />
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-64 w-full rounded-[2rem] bg-slate-50" />
              <Skeleton className="h-64 w-full rounded-[2rem] bg-slate-50" />
            </div>
            <Skeleton className="h-[500px] w-full rounded-[2rem] bg-slate-50" />
          </div>
        </main>
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden scale-[0.95] origin-top">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-3 text-slate-400 hover:text-orange-600 transition-colors font-black text-xs uppercase tracking-widest group"
        >
          <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-orange-200 group-hover:bg-orange-50 transition-all">
             <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </div>
          Back to Directory
        </motion.button>

        <div className="grid lg:grid-cols-[1fr,400px] gap-12 items-start">
          
          {/* Main Content Area */}
          <div className="space-y-12">
            
            {/* ELITE PROFILE HEADER */}
            <section className="relative bg-slate-950 rounded-[4rem] overflow-hidden p-12 md:p-16 border border-white/5 shadow-2xl">
              <div className="absolute inset-0 mesh-orange-red opacity-20" />
              <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center md:items-start text-center md:text-left">
                
                {/* Image Part */}
                <div className="relative flex-shrink-0">
                  <div className="w-48 h-48 md:w-56 md:h-56 rounded-[3.5rem] overflow-hidden border-[6px] border-white/10 shadow-2xl relative">
                    <img
                      src={doctor.profile_image || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=800&fit=crop`}
                      alt={doctor.full_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-green-500 border-4 border-slate-950 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                     <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Info Part */}
                <div className="flex-1 space-y-6">
                  <div className="space-y-2">
                    <Badge className="bg-orange-500/20 text-orange-400 border-none px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">
                       Clinical Specialist
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
                      {doctor.title} {doctor.full_name}
                    </h1>
                    <p className="text-slate-400 text-lg font-bold italic border-l-2 border-orange-500/30 pl-5">
                      {doctor.specialties?.join(', ') || 'General Excellence'}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-8">
                     <div className="flex flex-col items-center md:items-start">
                        <div className="flex items-center gap-2 text-orange-400 mb-1">
                           <Star className="w-5 h-5 fill-orange-400" />
                           <span className="text-2xl font-black tracking-tight text-white">{doctor.rating?.toFixed(1) || '5.0'}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Rating</span>
                     </div>
                     <div className="flex flex-col items-center md:items-start">
                        <div className="flex items-center gap-2 text-red-500 mb-1">
                           <Clock className="w-5 h-5" />
                           <span className="text-2xl font-black tracking-tight text-white">{doctor.years_experience || 0}+ yrs</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Expertise</span>
                     </div>
                     <div className="flex flex-col items-center md:items-start">
                        <div className="flex items-center gap-2 text-orange-600 mb-1">
                           <Shield className="w-5 h-5" />
                           <span className="text-2xl font-black tracking-tight text-white">Elite</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</span>
                     </div>
                  </div>

                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    {doctor.consultation_types?.map(type => (
                      <Badge key={type} className="bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-xl text-[9px] uppercase tracking-widest font-black flex items-center gap-2">
                        {type === 'telehealth' ? <Video className="w-3 h-3" /> :
                          type === 'home_visit' ? <Home className="w-3 h-3" /> :
                            <MapPin className="w-3 h-3" />}
                        {type.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* DETAILS TABS */}
            <Tabs defaultValue="about" className="space-y-10">
              <TabsList className="bg-slate-50 p-2 rounded-[2rem] border border-slate-100 flex gap-2">
                {['about', 'reviews', 'availability'].map((val) => (
                  <TabsTrigger 
                    key={val} 
                    value={val} 
                    className="flex-1 rounded-[1.5rem] py-4 font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-orange-600 transition-all"
                  >
                    {val}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* ABOUT SECTION */}
              <TabsContent value="about" className="space-y-10 focus:outline-none">
                <Card className="bg-white border-slate-100 rounded-[3rem] p-10 shadow-xl overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50/50 rounded-bl-[4rem] -z-10" />
                   <CardHeader className="p-0 mb-8">
                     <CardTitle className="text-3xl font-black text-slate-950 tracking-tight flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"><Stethoscope className="w-5 h-5 text-orange-600" /></div>
                        Clinical Profile
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="p-0">
                     <p className="text-slate-500 text-lg font-bold leading-relaxed italic opacity-90">{doctor.bio || 'This clinical elite profile is awaiting detailed bio integration.'}</p>
                   </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-8">
                   {doctor.qualifications?.length > 0 && (
                     <Card className="bg-slate-50 border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                        <CardHeader className="p-0 mb-6 flex flex-row items-center gap-4">
                           <Award className="w-6 h-6 text-orange-600" />
                           <CardTitle className="text-xl font-black text-slate-950 uppercase tracking-widest text-[10px]">Qualifications</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                           <ul className="space-y-4">
                             {doctor.qualifications.map((qual, i) => (
                               <li key={i} className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                                 <CheckCircle className="w-4 h-4 text-orange-500" />
                                 {qual}
                               </li>
                             ))}
                           </ul>
                        </CardContent>
                     </Card>
                   )}

                   <Card className="bg-slate-50 border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                      <CardHeader className="p-0 mb-6 flex flex-row items-center gap-4">
                         <Shield className="w-6 h-6 text-red-600" />
                         <CardTitle className="text-xl font-black text-slate-950 uppercase tracking-widest text-[10px]">Clinical Standards</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 space-y-6">
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Languages Spoken</p>
                           <div className="flex flex-wrap gap-2">
                             {doctor.languages?.map(lang => <Badge key={lang} className="bg-white text-slate-600 border border-slate-200 px-3 py-1 rounded-lg text-[9px] font-black">{lang}</Badge>)}
                           </div>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Insurance Acceptance</p>
                           <div className="flex flex-wrap gap-2">
                             {doctor.accepted_insurances?.map(ins => <Badge key={ins} className="bg-white text-orange-600 border border-orange-100 px-3 py-1 rounded-lg text-[9px] font-black">{ins}</Badge>)}
                           </div>
                        </div>
                      </CardContent>
                   </Card>
                </div>

                {/* Clinic Map */}
                {doctor.clinic_address && (
                  <Card className="bg-white border-slate-100 rounded-[3rem] p-10 shadow-xl">
                    <CardHeader className="p-0 mb-8 flex flex-row items-center justify-between">
                       <CardTitle className="text-2xl font-black text-slate-950 tracking-tight flex items-center gap-4">
                          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-red-600" /></div>
                          Clinical Facility
                       </CardTitle>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{doctor.clinic_name || 'Main Facility'}</p>
                    </CardHeader>
                    <CardContent className="p-0 space-y-6">
                      <div className="w-full h-80 rounded-[2rem] overflow-hidden shadow-inner border border-slate-100 relative group">
                        <iframe
                          title="Clinic Location"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          src={`https://www.google.com/maps?q=${encodeURIComponent(doctor.clinic_address)}&output=embed`}
                        ></iframe>
                      </div>
                      <div className="flex items-start gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                         <MapPin className="w-6 h-6 text-orange-600 shrink-0" />
                         <p className="text-slate-600 font-bold text-sm leading-relaxed">{doctor.clinic_address}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* REVIEWS SECTION */}
              <TabsContent value="reviews" className="focus:outline-none">
                 <Card className="bg-white border-slate-100 rounded-[3rem] p-10 shadow-xl">
                    <CardHeader className="p-0 mb-10 flex flex-row items-center justify-between">
                       <CardTitle className="text-3xl font-black text-slate-950 tracking-tight">Patient Testimony</CardTitle>
                       <div className="flex items-center gap-2 bg-orange-50 px-5 py-2 rounded-full border border-orange-100">
                          <Star className="w-5 h-5 fill-orange-500 text-orange-500" />
                          <span className="text-orange-700 font-black text-lg">{doctor.rating?.toFixed(1) || '5.0'}</span>
                       </div>
                    </CardHeader>
                    <CardContent className="p-0 space-y-8">
                       {canReview && !showReviewForm && (
                         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-orange-600 to-red-600 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
                           <div className="text-center md:text-left space-y-2">
                             <h4 className="text-2xl font-black tracking-tight leading-none">Share Your Clinical Outcome</h4>
                             <p className="text-white/80 font-bold text-xs italic">"Help our global community by rating your recent consultation."</p>
                           </div>
                           <Button onClick={() => setShowReviewForm(true)} className="bg-white text-orange-600 hover:bg-orange-50 rounded-xl px-8 py-6 font-black text-[10px] uppercase tracking-widest shadow-xl">
                              Begin Testimony
                           </Button>
                         </motion.div>
                       )}

                       {showReviewForm && (
                         <div className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100 space-y-8">
                           <h4 className="text-xl font-black text-slate-950 tracking-tight">Draft Testimony</h4>
                           <div className="space-y-4">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Global Rating</p>
                             <div className="flex items-center gap-3">
                               {[1, 2, 3, 4, 5].map((star) => (
                                 <button
                                   key={star}
                                   type="button"
                                   onClick={() => setReviewFormData({ ...reviewFormData, rating: star })}
                                   className="focus:outline-none hover:scale-110 transition-transform"
                                 >
                                   <Star className={`w-10 h-10 ${star <= reviewFormData.rating ? 'fill-orange-500 text-orange-500' : 'text-slate-200'}`} />
                                 </button>
                               ))}
                             </div>
                           </div>
                           <div className="space-y-4">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Clinical Observations</p>
                             <Textarea
                               placeholder="Draft your experience..."
                               className="bg-white min-h-[150px] rounded-2xl border-slate-200 font-bold p-6 focus:ring-4 focus:ring-orange-500/10"
                               value={reviewFormData.comment}
                               onChange={(e) => setReviewFormData({ ...reviewFormData, comment: e.target.value })}
                             />
                           </div>
                           <div className="flex items-center gap-4 pt-4">
                             <Button onClick={handleSubmitReview} disabled={submittingReview} className="bg-slate-950 text-white rounded-xl px-10 py-6 font-black text-xs uppercase tracking-widest shadow-xl">
                               {submittingReview ? 'Processing...' : 'Submit to System'}
                             </Button>
                             <Button variant="ghost" onClick={() => setShowReviewForm(false)} className="font-black text-xs text-slate-400 hover:text-red-600 uppercase tracking-widest">
                               Discard
                             </Button>
                           </div>
                         </div>
                       )}

                       {reviews.length > 0 ? (
                         <div className="grid gap-6">
                           {reviews.map((review) => (
                             <div key={review.id} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                               <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-orange-600 shadow-sm border border-slate-100">{review.patient_name?.charAt(0) || 'P'}</div>
                                    <div>
                                       <p className="font-black text-slate-950 text-sm">{review.patient_name || 'Elite Patient'}</p>
                                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified Patient</p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-100">
                                   {[...Array(5)].map((_, i) => (
                                     <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-orange-500 text-orange-500' : 'text-slate-200'}`} />
                                   ))}
                                 </div>
                               </div>
                               {review.comment && (
                                 <p className="text-slate-500 font-bold text-base leading-relaxed italic border-l-2 border-slate-200 pl-6 mx-2">{review.comment}</p>
                               )}
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="text-center py-20 space-y-6">
                           <MessageSquare className="w-16 h-16 mx-auto text-slate-100" />
                           <h4 className="text-2xl font-black text-slate-950 tracking-tight">No Testimonies Yet</h4>
                           <p className="text-slate-400 font-bold text-sm italic">"Be the first to share your outcome with Dr. {doctor.full_name}."</p>
                         </div>
                       )}
                    </CardContent>
                 </Card>
              </TabsContent>

              {/* AVAILABILITY SECTION */}
              <TabsContent value="availability" className="focus:outline-none">
                 <Card className="bg-white border-slate-100 rounded-[3rem] p-10 shadow-xl">
                    <CardHeader className="p-0 mb-10 flex flex-row items-center gap-4">
                       <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center"><CalendarDays className="w-5 h-5 text-orange-600" /></div>
                       <CardTitle className="text-3xl font-black text-slate-950 tracking-tight">Access Protocol</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-col items-center">
                       <Calendar
                         mode="single"
                         selected={selectedDate}
                         onSelect={setSelectedDate}
                         disabled={(date) => {
                           if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
                           if (doctor.holidays?.some(h => isSameDay(date, parseISO(h)))) return true;
                           if (doctor.working_hours) {
                             const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                             const dayName = daysOfWeek[date.getDay()];
                             const daySchedule = doctor.working_hours[dayName];
                             if (daySchedule && !daySchedule.active) return true;
                           }
                           return false;
                         }}
                         className="rounded-[2.5rem] border border-slate-100 shadow-xl p-8 bg-white scale-110 mb-12 origin-center"
                       />
                       <Button onClick={handleBooking} className="w-full max-w-lg bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-[2rem] py-8 text-xl font-black shadow-2xl active:scale-95 transition-all shimmer-btn">
                          Initialize Booking for {format(selectedDate, 'MMM d')}
                       </Button>
                    </CardContent>
                 </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* SIDEBAR WIDGETS */}
          <aside className="space-y-10 sticky top-24">
            
            {/* BOOKING CARD */}
            <Card className="bg-slate-950 rounded-[3.5rem] p-10 border border-white/10 shadow-2xl overflow-hidden relative group">
               <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="relative z-10 text-center space-y-8">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Consultation Fee</p>
                     <p className="text-6xl font-black text-white tracking-tighter leading-none">₹{doctor.consultation_fee || 0}</p>
                     <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Global Standard Rate</p>
                  </div>
                  
                  <div className="h-[1px] bg-white/10 w-full" />
                  
                  <div className="space-y-6">
                     <Button 
                       onClick={handleBooking}
                       className="w-full bg-white hover:bg-orange-50 text-slate-950 rounded-2xl py-8 text-lg font-black shadow-xl active:scale-95 transition-all"
                     >
                        Secure Slot Now
                     </Button>
                     <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2 text-slate-400">
                           <Shield className="w-4 h-4 text-green-500" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Encrypted</span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-slate-700 rounded-full" />
                        <div className="flex items-center gap-2 text-slate-400">
                           <Zap className="w-4 h-4 text-orange-500" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Instant</span>
                        </div>
                     </div>
                  </div>
               </div>
            </Card>

            {/* CLINIC WIDGET */}
            <Card className="bg-white border-slate-100 rounded-[3rem] p-10 shadow-xl overflow-hidden">
               <CardHeader className="p-0 mb-8 flex flex-row items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center"><Home className="w-5 h-5 text-slate-600" /></div>
                  <CardTitle className="text-xl font-black text-slate-950 tracking-tight">Facility Details</CardTitle>
               </CardHeader>
               <CardContent className="p-0 space-y-6">
                  <div className="space-y-1">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clinic Name</p>
                     <p className="text-lg font-black text-slate-900 tracking-tight">{doctor.clinic_name || 'Elite Health Annex'}</p>
                  </div>
                  {doctor.phone && (
                     <div className="space-y-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Direct Extension</p>
                        <p className="text-lg font-black text-slate-900 tracking-tight">{doctor.phone}</p>
                     </div>
                  )}
               </CardContent>
            </Card>

            {/* SPONSORED CONTENT */}
            {ads.length > 0 && (
              <div className="space-y-6">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] text-center">Elite Partnership</p>
                {ads.map((ad, idx) => (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={idx} 
                    className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden cursor-pointer" 
                    onClick={() => handleAdClick(ad)}
                  >
                    <div className="relative h-40">
                       <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                       <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-all" />
                       <div className="absolute top-4 right-4">
                          <Badge className="bg-white/90 backdrop-blur text-slate-950 border-none font-black text-[7px] uppercase tracking-widest px-3 py-1.5 rounded-lg">Partner</Badge>
                       </div>
                    </div>
                    <CardContent className="p-6 text-center">
                       <h3 className="font-black text-xs text-slate-900 line-clamp-2 leading-tight uppercase tracking-tight">{ad.title}</h3>
                    </CardContent>
                  </motion.div>
                ))}
              </div>
            )}

            {/* TRUST BADGE */}
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center gap-4">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
               </div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                  Join 50k+ patients who trust our elite clinical network.
               </p>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
