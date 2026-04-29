import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, Footer } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Calendar } from '../components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Video,
  MapPin,
  Clock,
  User,
  Users,
  CreditCard,
  CheckCircle,
  Loader2,
  Home,
  AlertCircle,
  Stethoscope,
  Shield,
  Zap,
  CalendarDays,
  Activity
} from 'lucide-react';
import axios from 'axios';
import { format, addDays, isToday, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BOOKING_STEPS = [
  { id: 1, title: 'Modality', icon: Video },
  { id: 2, title: 'Schedule', icon: Clock },
  { id: 3, title: 'Patient', icon: User },
  { id: 4, title: 'Clinical Notes', icon: Activity },
  { id: 5, title: 'Synthesis', icon: CreditCard }
];

export default function BookingFlow() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [step, setStep] = useState(1);
  const [doctor, setDoctor] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [bookingData, setBookingData] = useState({
    consultation_type: 'in_person',
    appointment_date: new Date(),
    appointment_time: '',
    patient_type: 'myself',
    family_member_id: null,
    reason: '',
    home_address: ''
  });

  useEffect(() => {
    fetchData();
  }, [doctorId]);

  useEffect(() => {
    if (bookingData.appointment_date) {
      fetchAvailableSlots(bookingData.appointment_date);
    }
  }, [bookingData.appointment_date]);

  const fetchAvailableSlots = async (date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await axios.get(`${API_URL}/api/doctors/${doctorId}/available-slots?date=${dateStr}`);
      setAvailableSlots(res.data.slots || []);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    }
  };

  const fetchData = async () => {
    try {
      const [doctorRes, familyRes] = await Promise.all([
        axios.get(`${API_URL}/api/doctors/${doctorId}`),
        axios.get(`${API_URL}/api/family-members`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setDoctor(doctorRes.data);
      setFamilyMembers(familyRes.data.members);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load clinical booking parameters');
      navigate('/doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && bookingData.consultation_type === 'home_visit' && !bookingData.home_address) {
      toast.error('Clinical address required for home visit protocol');
      return;
    }
    if (step === 2 && (!bookingData.appointment_date || !bookingData.appointment_time)) {
      toast.error('Select schedule parameters to continue');
      return;
    }
    if (step === 3 && bookingData.patient_type !== 'myself' && !bookingData.family_member_id) {
      toast.error('Select subject for the appointment');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) navigate(-1);
    else setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const appointmentData = {
        doctor_id: doctorId,
        consultation_type: bookingData.consultation_type,
        appointment_date: format(bookingData.appointment_date, 'yyyy-MM-dd'),
        appointment_time: bookingData.appointment_time,
        reason: bookingData.reason,
        is_home_visit: bookingData.consultation_type === 'home_visit',
        home_address: bookingData.home_address,
        family_member_id: bookingData.patient_type !== 'myself' ? bookingData.family_member_id : null
      };

      const response = await axios.post(
        `${API_URL}/api/appointments`,
        appointmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Clinical appointment successfully initialized!');
      navigate(`/appointments/${response.data.appointment.id}`);
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error(error.response?.data?.detail || 'Clinical synthesis failed');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfdfd] flex items-center justify-center">
        <div className="text-center space-y-4">
           <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto" />
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initializing Secure Booking Channel</p>
        </div>
      </div>
    );
  }

  const progress = (step / BOOKING_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden scale-[0.95] origin-top">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-24">
        
        {/* ELITE PROGRESS HEADER */}
        <div className="mb-12 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
               <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-full">Secure Booking Protocol</Badge>
               <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter">Clinical Synthesis.</h1>
            </div>
            <div className="text-right">
               <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Phase {step} of 5</span>
            </div>
          </div>
          
          <div className="relative pt-4">
             <Progress value={progress} className="h-1.5 bg-slate-100 [&>div]:bg-gradient-to-r [&>div]:from-orange-600 [&>div]:to-red-600 shadow-sm" />
             <div className="flex justify-between mt-8">
               {BOOKING_STEPS.map((s) => (
                 <div key={s.id} className="flex flex-col items-center gap-3">
                   <motion.div 
                     animate={{ 
                       scale: s.id === step ? 1.2 : 1,
                       backgroundColor: s.id <= step ? '#f97316' : '#f8fafc',
                       color: s.id <= step ? '#ffffff' : '#94a3b8'
                     }}
                     className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-lg transition-colors border ${s.id <= step ? 'border-orange-600' : 'border-slate-100'}`}
                   >
                     {s.id < step ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                   </motion.div>
                   <span className={`text-[9px] font-black uppercase tracking-widest hidden sm:block ${s.id === step ? 'text-orange-600' : 'text-slate-400'}`}>{s.title}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* CLINICAL CONTEXT CARD */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Card className="bg-slate-950 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 mesh-orange-red opacity-10" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/10 flex-shrink-0">
                <img src={doctor?.profile_image || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=800&fit=crop`} alt="Doctor" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-1">
                <h3 className="text-xl font-black text-white tracking-tight">{doctor?.title} {doctor?.full_name}</h3>
                <p className="text-orange-400 font-bold text-xs italic uppercase tracking-widest">{doctor?.specialties?.[0] || 'Clinical Specialist'}</p>
              </div>
              <div className="text-center md:text-right space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Synthesis Fee</p>
                <p className="text-3xl font-black text-white tracking-tighter leading-none">₹{doctor?.consultation_fee}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* INTERACTIVE FORM FLOW */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-white border-slate-100 rounded-[3rem] p-10 shadow-xl min-h-[400px] flex flex-col">
              <CardContent className="p-0 flex-1">
                
                {/* Step 1: Modality */}
                {step === 1 && (
                  <div className="space-y-10">
                    <div className="space-y-3">
                       <h2 className="text-3xl font-black text-slate-950 tracking-tight">Select Care Modality</h2>
                       <p className="text-slate-400 font-bold text-sm italic">"How would you like to initialize this clinical encounter?"</p>
                    </div>
                    <RadioGroup
                      value={bookingData.consultation_type}
                      onValueChange={(value) => setBookingData({ ...bookingData, consultation_type: value })}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      {[
                        { id: 'in_person', title: 'Clinical Visit', desc: 'Face-to-face facility encounter.', icon: MapPin, color: 'bg-blue-100 text-blue-600' },
                        { id: 'telehealth', title: 'HD Telehealth', desc: 'Secure remote video synthesis.', icon: Video, color: 'bg-orange-100 text-orange-600' },
                        { id: 'home_visit', title: 'Residential Care', desc: 'Direct physician mobilization.', icon: Home, color: 'bg-red-100 text-red-600' }
                      ].filter(t => doctor?.consultation_types?.includes(t.id)).map(type => (
                        <Label
                          key={type.id}
                          htmlFor={type.id}
                          className={`flex flex-col gap-6 p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all ${bookingData.consultation_type === type.id
                            ? 'border-orange-600 bg-orange-50/50 shadow-lg'
                            : 'border-slate-100 hover:border-orange-200'
                            }`}
                        >
                          <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
                          <div className={`w-14 h-14 rounded-2xl ${type.color} flex items-center justify-center shadow-sm`}>
                            <type.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-black text-lg text-slate-900 tracking-tight">{type.title}</p>
                            <p className="text-xs text-slate-400 font-bold italic">{type.desc}</p>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>

                    {bookingData.consultation_type === 'home_visit' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Residential Coordinates</Label>
                        <Input
                          placeholder="Provide full clinical dispatch address..."
                          value={bookingData.home_address}
                          onChange={(e) => setBookingData({ ...bookingData, home_address: e.target.value })}
                          className="rounded-2xl h-16 border-slate-100 bg-slate-50 font-bold px-6 focus:ring-4 focus:ring-orange-500/10"
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {/* Step 2: Schedule */}
                {step === 2 && (
                  <div className="space-y-10">
                    <div className="space-y-3">
                       <h2 className="text-3xl font-black text-slate-950 tracking-tight">Access Window</h2>
                       <p className="text-slate-400 font-bold text-sm italic">"Synchronize your schedule with clinical availability."</p>
                    </div>

                    <div className="grid md:grid-cols-[1fr,1.2fr] gap-12">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Phase</Label>
                        <Calendar
                          mode="single"
                          selected={bookingData.appointment_date}
                          onSelect={(date) => setBookingData({ ...bookingData, appointment_date: date })}
                          disabled={(date) => {
                            const today = new Date(new Date().setHours(0, 0, 0, 0));
                            return date < today || date > addDays(today, 30);
                          }}
                          className="rounded-[2rem] border border-slate-100 shadow-xl p-6 bg-white w-fit mx-auto"
                        />
                      </div>

                      <div className="space-y-6">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available Slots</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {availableSlots.length === 0 ? (
                            <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                               <AlertCircle className="w-8 h-8 text-slate-200 mx-auto" />
                               <p className="text-xs font-black text-slate-400 uppercase tracking-widest">System Unavailable</p>
                            </div>
                          ) : availableSlots.map((slot) => {
                            let isPastTime = false;
                            if (isToday(bookingData.appointment_date)) {
                              const [hour, min] = slot.time.split(':').map(Number);
                              const slotTime = new Date();
                              slotTime.setHours(hour, min, 0, 0);
                              if (slotTime < new Date()) isPastTime = true;
                            }
                            const isUnavailable = !slot.is_available || isPastTime;

                            return (
                              <motion.button
                                key={slot.time}
                                whileTap={{ scale: 0.95 }}
                                disabled={isUnavailable}
                                onClick={() => setBookingData({ ...bookingData, appointment_time: slot.time })}
                                className={`h-14 rounded-xl font-black text-sm border transition-all ${
                                  bookingData.appointment_time === slot.time
                                  ? 'bg-slate-950 border-slate-950 text-white shadow-lg'
                                  : isUnavailable 
                                    ? 'bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed'
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-orange-500'
                                }`}
                              >
                                {slot.time}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Patient Selection */}
                {step === 3 && (
                  <div className="space-y-10">
                    <div className="space-y-3">
                       <h2 className="text-3xl font-black text-slate-950 tracking-tight">Subject Verification</h2>
                       <p className="text-slate-400 font-bold text-sm italic">"Identify the clinical subject for this encounter."</p>
                    </div>

                    <RadioGroup
                      value={bookingData.patient_type}
                      onValueChange={(value) => setBookingData({ ...bookingData, patient_type: value, family_member_id: null })}
                      className="grid gap-4"
                    >
                      <Label
                        htmlFor="myself"
                        className={`flex items-center gap-6 p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all ${bookingData.patient_type === 'myself'
                          ? 'border-orange-600 bg-orange-50/50 shadow-lg'
                          : 'border-slate-100 hover:border-orange-200'
                          }`}
                      >
                        <RadioGroupItem value="myself" id="myself" className="sr-only" />
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-orange-600 shadow-sm">
                           {user?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="font-black text-lg text-slate-900 tracking-tight">Primary User</p>
                          <p className="text-xs text-slate-400 font-bold italic">{user?.full_name}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 ${bookingData.patient_type === 'myself' ? 'bg-orange-600 border-orange-600' : 'border-slate-200'}`} />
                      </Label>

                      {familyMembers.map((member) => (
                        <Label
                          key={member.id}
                          htmlFor={`member-${member.id}`}
                          className={`flex items-center gap-6 p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all ${bookingData.family_member_id === member.id
                            ? 'border-orange-600 bg-orange-50/50 shadow-lg'
                            : 'border-slate-100 hover:border-orange-200'
                            }`}
                        >
                          <RadioGroupItem 
                            value="family" 
                            id={`member-${member.id}`} 
                            className="sr-only" 
                            checked={bookingData.family_member_id === member.id}
                            onClick={() => setBookingData({ ...bookingData, patient_type: 'family', family_member_id: member.id })}
                          />
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-400">
                             {member.full_name?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-lg text-slate-900 tracking-tight">{member.full_name}</p>
                            <p className="text-xs text-slate-400 font-bold italic">{member.relationship}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 ${bookingData.family_member_id === member.id ? 'bg-orange-600 border-orange-600' : 'border-slate-200'}`} />
                        </Label>
                      ))}
                    </RadioGroup>

                    {familyMembers.length < 4 && (
                      <Button variant="ghost" onClick={() => navigate('/family-members')} className="rounded-2xl py-6 font-black text-xs text-orange-600 hover:text-orange-700 uppercase tracking-widest gap-2">
                        <Users className="w-4 h-4" /> Add Secondary Clinical Subject
                      </Button>
                    )}
                  </div>
                )}

                {/* Step 4: Clinical Notes */}
                {step === 4 && (
                  <div className="space-y-10">
                    <div className="space-y-3">
                       <h2 className="text-3xl font-black text-slate-950 tracking-tight">Clinical Observations</h2>
                       <p className="text-slate-400 font-bold text-sm italic">"Provide preliminary notes to optimize specialist synthesis."</p>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Symptoms & History</Label>
                      <Textarea
                        placeholder="Briefly describe your current clinical status..."
                        value={bookingData.reason}
                        onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                        rows={8}
                        className="rounded-[2rem] border-slate-100 bg-slate-50 font-bold p-8 focus:ring-4 focus:ring-orange-500/10 focus:bg-white transition-all text-lg"
                      />
                    </div>
                  </div>
                )}

                {/* Step 5: Synthesis Confirm */}
                {step === 5 && (
                  <div className="space-y-10">
                    <div className="space-y-3">
                       <h2 className="text-3xl font-black text-slate-950 tracking-tight">Clinical Confirmation</h2>
                       <p className="text-slate-400 font-bold text-sm italic">"Verify clinical parameters before initializing encounter."</p>
                    </div>

                    <div className="bg-slate-50 rounded-[3rem] p-10 space-y-8 border border-slate-100">
                      <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Care Modality</p>
                           <p className="font-black text-slate-900 flex items-center gap-2">
                             {bookingData.consultation_type === 'telehealth' ? <Video className="w-4 h-4 text-orange-600" /> : <MapPin className="w-4 h-4 text-red-600" />}
                             {bookingData.consultation_type.replace('_', ' ').toUpperCase()}
                           </p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Schedule</p>
                           <p className="font-black text-slate-900">{format(bookingData.appointment_date, 'MMM d, yyyy')} @ {bookingData.appointment_time}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clinical Subject</p>
                           <p className="font-black text-slate-900">{bookingData.patient_type === 'myself' ? user?.full_name : familyMembers.find(m => m.id === bookingData.family_member_id)?.full_name}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Access Pass</p>
                           <p className="text-2xl font-black text-orange-600 tracking-tighter">₹{doctor?.consultation_fee}</p>
                        </div>
                      </div>

                      <div className="h-[1px] bg-slate-200 w-full" />
                      
                      <div className="p-6 bg-white rounded-2xl border border-slate-100 flex gap-4">
                         <Shield className="w-6 h-6 text-green-500 shrink-0" />
                         <p className="text-[10px] font-bold text-slate-500 leading-relaxed italic">"Encrypted clinical transaction compliant with global medical data standards. Payment will be collected at facility or after synthesis."</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              {/* NAVIGATION CONTROLS */}
              <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between">
                <Button variant="ghost" onClick={handleBack} className="rounded-xl px-8 py-6 font-black text-xs text-slate-400 hover:text-red-600 uppercase tracking-widest group">
                   <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
                </Button>

                {step < 5 ? (
                  <Button onClick={handleNext} className="bg-slate-950 hover:bg-orange-600 text-white rounded-2xl px-12 py-7 font-black text-sm uppercase tracking-[0.2em] shadow-xl group transition-all active:scale-95">
                    Advance <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className="bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-2xl px-12 py-7 font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 shimmer-btn"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm & Initialize"}
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
