import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Navbar, Footer } from '../components/Layout';
import {
  Stethoscope,
  Video,
  Calendar,
  Shield,
  Star,
  ArrowRight,
  Heart,
  Brain,
  Bone,
  Eye,
  Baby,
  Activity,
  Download,
  Smartphone,
  CheckCircle2,
  ChevronDown,
  Search,
  MapPin,
  Users
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://hidoctor-production.up.railway.app';

const specialties = [
  { name: 'Cardiology', icon: Heart, color: 'bg-red-100 text-red-600' },
  { name: 'Neurology', icon: Brain, color: 'bg-purple-100 text-purple-600' },
  { name: 'Orthopedics', icon: Bone, color: 'bg-amber-100 text-amber-600' },
  { name: 'Ophthalmology', icon: Eye, color: 'bg-blue-100 text-blue-600' },
  { name: 'Pediatrics', icon: Baby, color: 'bg-pink-100 text-pink-600' },
  { name: 'General Medicine', icon: Activity, color: 'bg-green-100 text-green-600' },
  { name: 'Dentistry', icon: Stethoscope, color: 'bg-cyan-100 text-cyan-600' },
  { name: 'Dermatology', icon: Shield, color: 'bg-orange-100 text-orange-600' },
  { name: 'ENT', icon: Activity, color: 'bg-teal-100 text-teal-600' },
  { name: 'Psychiatry', icon: Brain, color: 'bg-indigo-100 text-indigo-600' },
  { name: 'Gynecology', icon: Heart, color: 'bg-rose-100 text-rose-600' },
  { name: 'Urology', icon: Activity, color: 'bg-sky-100 text-sky-600' },
  { name: 'Gastroenterology', icon: Activity, color: 'bg-lime-100 text-lime-600' },
  { name: 'Pulmonology', icon: Activity, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Endocrinology', icon: Activity, color: 'bg-violet-100 text-violet-600' },
  { name: 'Oncology', icon: Shield, color: 'bg-fuchsia-100 text-fuchsia-600' },
  { name: 'Nephrology', icon: Activity, color: 'bg-blue-100 text-blue-600' },
  { name: 'Sports Medicine', icon: Activity, color: 'bg-yellow-100 text-yellow-600' },
  { name: 'Physiotherapy', icon: Activity, color: 'bg-green-100 text-green-600' },
  { name: 'Ayurveda', icon: Heart, color: 'bg-amber-100 text-amber-600' },
  { name: 'Rheumatology', icon: Activity, color: 'bg-rose-100 text-rose-600' },
  { name: 'Hematology', icon: Activity, color: 'bg-red-100 text-red-600' },
  { name: 'Allergy & Immunology', icon: Shield, color: 'bg-sky-100 text-sky-600' },
  { name: 'Infectious Disease', icon: Shield, color: 'bg-orange-100 text-orange-600' },
  { name: 'Pain Management', icon: Activity, color: 'bg-slate-100 text-slate-600' },
  { name: 'Geriatrics', icon: Activity, color: 'bg-zinc-100 text-zinc-600' },
  { name: 'Neonatology', icon: Baby, color: 'bg-pink-100 text-pink-600' },
  { name: 'Plastic Surgery', icon: Heart, color: 'bg-purple-100 text-purple-600' },
  { name: 'Vascular Surgery', icon: Heart, color: 'bg-red-100 text-red-600' },
  { name: 'Radiology', icon: Eye, color: 'bg-blue-100 text-blue-600' },
  { name: 'Pathology', icon: Activity, color: 'bg-violet-100 text-violet-600' },
  { name: 'Anesthesiology', icon: Shield, color: 'bg-teal-100 text-teal-600' },
  { name: 'Emergency Medicine', icon: Activity, color: 'bg-red-100 text-red-600' },
  { name: 'Family Medicine', icon: Heart, color: 'bg-green-100 text-green-600' },
  { name: 'Internal Medicine', icon: Activity, color: 'bg-emerald-100 text-emerald-600' },
  { name: 'Homeopathy', icon: Heart, color: 'bg-amber-100 text-amber-600' },
  { name: 'Nutrition & Dietetics', icon: Activity, color: 'bg-lime-100 text-lime-600' },
];

const MedicalIllustration = () => (
  <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
    <motion.svg
      animate={{ 
        y: [0, -30, 0],
        rotate: [0, 8, 0],
        scale: [1, 1.05, 1]
      }}
      transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-20 right-[-5%] w-[400px] h-[400px] opacity-[0.15] text-orange-600"
      viewBox="0 0 200 200"
    >
      <path fill="currentColor" d="M100 20 L120 80 L180 80 L130 120 L150 180 L100 140 L50 180 L70 120 L20 80 L80 80 Z" />
    </motion.svg>
    <motion.div
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.1, 0.3, 0.1],
        x: [0, 50, 0]
      }}
      transition={{ duration: 12, repeat: Infinity }}
      className="absolute bottom-20 left-[-10%] w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[120px]"
    />
    <div className="absolute top-0 left-0 w-full h-full mesh-orange-red opacity-30" />
  </div>
);

const FloatingBadge = ({ icon: Icon, text, delay = 0, className }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 1, type: "spring" }}
    className={`absolute glass-premium px-6 py-3.5 rounded-[2rem] flex items-center gap-4 shadow-2xl border-white/60 z-20 animate-float-complex ${className}`}
  >
    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg">
      <Icon className="w-6 h-6" />
    </div>
    <span className="text-sm font-black text-slate-900 whitespace-nowrap tracking-tight">{text}</span>
  </motion.div>
);

const TrustTicker = () => (
  <div className="bg-slate-950 py-6 overflow-hidden border-y border-white/5">
    <div className="flex animate-slide-infinite whitespace-nowrap gap-20">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="flex items-center gap-10 opacity-40 grayscale hover:grayscale-0 transition-all cursor-default">
          <span className="text-white font-black text-xl tracking-[0.2em]">HIDOCTOR EXCELLENCE</span>
          <div className="w-2 h-2 bg-orange-600 rounded-full" />
          <span className="text-white font-black text-xl tracking-[0.2em]">VERIFIED CLINICAL CARE</span>
          <div className="w-2 h-2 bg-red-600 rounded-full" />
          <span className="text-white font-black text-xl tracking-[0.2em]">ISO 27001 SECURE</span>
          <div className="w-2 h-2 bg-orange-600 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/campaigns?placement=home`);
        setAds(response.data.ads || []);
      } catch (error) {
        console.error('Error fetching ads:', error);
      }
    };

    const fetchTopDoctors = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/doctors/top-rated`);
        setTopDoctors(response.data.doctors || []);
      } catch (error) {
        console.error('Error fetching top doctors:', error);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchAds();
    fetchTopDoctors();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/doctors?search=${searchName}&location=${searchLocation}`);
  };

  const blogPreviews = [
    {
      title: "Understanding Modern Telehealth",
      excerpt: "How digital medicine is revolutionizing the patient experience in 2026.",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&h=600&fit=crop",
      category: "Innovation",
      date: "Oct 24, 2025"
    },
    {
      title: "The Future of Preventive Care",
      excerpt: "New strategies to stay ahead of your health with early diagnostic tools.",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=600&fit=crop",
      category: "Clinical",
      date: "Oct 20, 2025"
    },
    {
      title: "Holistic Health Trends",
      excerpt: "Combining clinical excellence with wellness for a complete life approach.",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop",
      category: "Wellness",
      date: "Oct 15, 2025"
    }
  ];

  const faqs = [
    { question: "How do I book an appointment?", answer: "Simply search for a doctor, view their profile, and click the 'Book Now' button to choose an available slot." },
    { question: "Are the doctors verified?", answer: "Yes, every doctor on our platform undergoes a rigorous 5-step verification process for clinical excellence." },
    { question: "Can I cancel my booking?", answer: "Yes, you can cancel or reschedule through your dashboard up to 24 hours before the appointment." }
  ];

  const FAQAccordion = ({ faq }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="border-b border-slate-100 last:border-none">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full py-8 flex justify-between items-center text-left hover:text-orange-600 transition-colors group">
          <span className="text-xl font-black text-slate-900 group-hover:text-orange-600 tracking-tight">{faq.question}</span>
          <div className={`w-8 h-8 rounded-full border-2 border-slate-200 flex items-center justify-center transition-transform ${isOpen ? 'rotate-180 border-orange-600 text-orange-600' : ''}`}>
             <ChevronDown className="w-5 h-5" />
          </div>
        </button>
        <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} className="overflow-hidden">
          <p className="pb-8 text-slate-500 text-lg font-medium leading-relaxed">{faq.answer}</p>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden">
      <Navbar />

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative pt-24 pb-48 overflow-hidden">
        <MedicalIllustration />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -80 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
              className="space-y-16"
            >
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 px-6 py-3 rounded-full shadow-lg shadow-orange-500/5">
                <div className="w-2.5 h-2.5 bg-orange-600 rounded-full animate-ping" />
                <span className="text-orange-700 text-[11px] font-black uppercase tracking-[0.25em]">Global Clinical Standard 2026</span>
              </div>

              <h1 className="text-8xl md:text-9xl font-black text-slate-950 leading-[0.85] tracking-tight">
                Health care <br /> that <br /> <span className="text-orange-600 relative inline-block animate-pulse">
                  inspires.
                  <svg className="absolute -bottom-6 left-0 w-full h-6 text-red-500/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="8" />
                  </svg>
                </span>
              </h1>

              <p className="text-2xl text-slate-500 leading-relaxed max-w-xl font-bold italic border-l-8 border-orange-500/30 pl-8">
                "We don't just treat symptoms. We redesign your future health through precision medicine and elite clinical expertise."
              </p>

              {/* Advanced Search Bar */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center bg-white p-4 rounded-[2.5rem] shadow-[0_30px_90px_rgba(239,68,68,0.12)] border border-orange-100/50 max-w-3xl group focus-within:ring-4 ring-orange-500/10 transition-all">
                <div className="flex-1 flex items-center px-6 w-full border-b sm:border-b-0 sm:border-r border-slate-100 py-5 sm:py-0">
                  <Search className="w-8 h-8 text-orange-600 mr-5 animate-pulse" />
                  <input 
                    type="text" 
                    placeholder="Doctor, specialty, or clinic..." 
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 font-black text-xl"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                </div>
                <div className="flex-1 flex items-center px-6 w-full py-5 sm:py-0">
                  <MapPin className="w-8 h-8 text-red-600 mr-5" />
                  <input 
                    type="text" 
                    placeholder="Near you" 
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 font-black text-xl"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full sm:w-auto bg-gradient-to-br from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-[1.5rem] px-16 py-8 text-xl font-black shadow-2xl shadow-red-600/30 active:scale-95 transition-all shimmer-btn">
                  Explore Now
                </Button>
              </form>
            </motion.div>

            {/* Right Image Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.7, rotate: 5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative z-10 rounded-[5rem] overflow-hidden shadow-[0_60px_120px_rgba(239,68,68,0.15)] border-[15px] border-white group">
                <img src="/images/hero_doctor_new.png" alt="Elite Specialist" className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-red-600/30 via-transparent to-transparent mix-blend-overlay" />
                <div className="absolute top-0 left-0 w-full h-full bg-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <FloatingBadge 
                icon={CheckCircle2} 
                text="100% Elite Verification" 
                className="-top-12 -right-16 bg-white border-orange-500"
                delay={0.6}
              />
              <FloatingBadge 
                icon={Video} 
                text="Ultra-HD Telehealth" 
                className="top-1/3 -left-24 bg-white border-red-500"
                delay={0.8}
              />
              <FloatingBadge 
                icon={Smartphone} 
                text="Unified Health App" 
                className="-bottom-16 left-1/4 bg-white border-orange-500"
                delay={1.1}
              />

              <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-200/40 rounded-full blur-[120px] -z-10 animate-pulse" />
              <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-red-200/40 rounded-full blur-[120px] -z-10 animate-pulse animation-delay-2000" />
            </motion.div>
          </div>
        </div>
      </section>

      <TrustTicker />

      {/* ==================== TRUST STATS BAR ==================== */}
      <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#f97316_1.5px,transparent_1.5px)] [background-size:30px_30px]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-20">
            {[
              { label: 'Total Patients', value: '50k+', icon: Users },
              { label: 'Top Doctors', value: '1,200+', icon: Stethoscope },
              { label: 'Success Rate', value: '99.9%', icon: Star },
              { label: 'Expert Care', value: '24/7', icon: Shield }
            ].map((stat, idx) => (
              <motion.div 
                key={idx} 
                whileHover={{ y: -10, scale: 1.05 }}
                className="text-center group"
              >
                <div className="flex items-center justify-center gap-4 mb-6">
                   <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-orange-600 transition-all duration-500">
                      <stat.icon className="w-8 h-8 text-orange-500 group-hover:text-white" />
                   </div>
                   <span className="text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]">{stat.value}</span>
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] group-hover:text-orange-500 transition-colors">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== BROWSE BY SPECIALTY ==================== */}
      <section id="specialties" className="py-40 bg-white relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-slate-50 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-12">
            <div className="space-y-6">
              <h2 className="text-6xl font-black text-slate-950 tracking-tight leading-none">Curated Excellence.</h2>
              <p className="text-slate-500 text-2xl max-w-xl font-bold leading-relaxed">
                Elite medical divisions categorized to connect you with the top 0.1% of global specialists.
              </p>
            </div>
            <Link to="/doctors" className="inline-flex items-center bg-slate-950 hover:bg-orange-600 text-white px-12 py-6 rounded-[2rem] font-black gap-4 transition-all group shadow-2xl shadow-slate-950/20 active:scale-95">
              Full Directory <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {specialties.slice(0, 8).map((spec, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -15, scale: 1.02 }}
                className="group cursor-pointer bg-slate-50 border border-slate-100 p-12 rounded-[4rem] hover:bg-white hover:shadow-[0_40px_80px_rgba(239,68,68,0.12)] transition-all duration-500 relative overflow-hidden"
                onClick={() => navigate(`/doctors?specialty=${spec.name}`)}
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                <div className={`w-20 h-20 rounded-3xl ${spec.color} flex items-center justify-center mb-10 group-hover:scale-110 transition-transform shadow-xl relative z-10`}>
                  <spec.icon className="w-10 h-10" />
                </div>
                <h3 className="text-3xl font-black text-slate-950 mb-5 relative z-10">{spec.name}</h3>
                <p className="text-base text-slate-500 font-bold leading-relaxed mb-8 relative z-10">
                   World-class diagnostics and precision care protocols for your {spec.name.toLowerCase()} health.
                </p>
                <div className="flex items-center gap-3 text-red-600 font-black text-xs uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                  Explore Hub <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== WHY HIDOCTOR ==================== */}
      <section className="py-40 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-16">
              <h2 className="text-7xl font-black text-white tracking-tight leading-[1.1]">
                Demand <span className="text-shine">quality</span> <br /> without compromise.
              </h2>
              <div className="space-y-10">
                {[
                  { title: "Clinical Elite", desc: "Rigorous vetting ensures only the top practitioners join our network.", icon: Stethoscope, color: "bg-orange-500" },
                  { title: "Military-Grade Security", desc: "Your health records are protected with 256-bit AES encryption.", icon: Shield, color: "bg-red-600" },
                  { title: "Real-time Ecosystem", desc: "Instant clinical synchronization across your entire digital life.", icon: Smartphone, color: "bg-orange-600" }
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    whileHover={{ x: 20 }}
                    className="flex gap-8 group cursor-default"
                  >
                    <div className={`w-20 h-20 ${item.color} rounded-3xl flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-all duration-500`}>
                      <item.icon className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h4 className="text-3xl font-black text-white mb-2 tracking-tight group-hover:text-orange-500 transition-colors">{item.title}</h4>
                      <p className="text-slate-400 text-lg font-bold leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="relative">
               <div className="aspect-square bg-gradient-to-br from-orange-500 to-red-600 rounded-[5rem] shadow-[0_50px_100px_rgba(239,68,68,0.4)] overflow-hidden p-6 animate-float-complex">
                  <div className="w-full h-full bg-slate-950 rounded-[4rem] relative overflow-hidden flex flex-col items-center justify-center text-center gap-8 border border-white/10">
                     <div className="relative">
                        <Stethoscope className="w-32 h-32 text-orange-500 animate-pulse relative z-10" />
                        <div className="absolute inset-0 bg-orange-600/50 blur-[50px] animate-ping" />
                     </div>
                     <div className="space-y-2">
                        <p className="text-white text-5xl font-black tracking-[0.3em] uppercase">HiDoctor</p>
                        <p className="text-orange-500 font-black tracking-[0.5em] text-xs uppercase">Premium Clinical AI</p>
                     </div>
                     <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-red-600/20 blur-[100px] rounded-full" />
                     <div className="absolute -top-20 -left-20 w-80 h-80 bg-orange-600/20 blur-[100px] rounded-full" />
                  </div>
               </div>
               <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-500 rounded-full blur-3xl animate-pulse" />
               <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-orange-500 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TOP RATED SPECIALISTS ==================== */}
      <section id="doctors" className="py-40 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-32 space-y-6">
            <Badge className="bg-orange-100 text-orange-700 border-none font-black text-xs px-6 py-2 rounded-full uppercase tracking-widest mb-4">Elite 1% Only</Badge>
            <h2 className="text-7xl font-black text-slate-950 tracking-tight leading-tight">Elite Clinical Network.</h2>
            <p className="text-slate-500 text-2xl font-bold max-w-3xl leading-relaxed italic">"Access the most prestigious medical minds, globally recognized for excellence in patient outcomes."</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
            {loadingDoctors ? (
              [1, 2, 3].map(i => <div key={i} className="h-[600px] bg-slate-100 animate-pulse rounded-[4rem]" />)
            ) : topDoctors.map((doc, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -20 }}
                className="bg-white rounded-[4.5rem] border border-slate-100 shadow-[0_30px_70px_rgba(239,68,68,0.06)] overflow-hidden flex flex-col group relative"
              >
                <div className="relative h-96 overflow-hidden">
                  <img src={doc.profile_image || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=800&fit=crop`} alt={doc.full_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  <div className="absolute top-8 right-8">
                    <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/30 text-white animate-pulse">
                       <CheckCircle2 className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="absolute bottom-10 left-10 right-10">
                    <p className="text-orange-400 text-xs font-black uppercase tracking-[0.3em] mb-2">{doc.specialties?.[0] || 'Premium Specialist'}</p>
                    <h3 className="text-4xl font-black text-white tracking-tight">{doc.full_name}</h3>
                  </div>
                </div>
                
                <div className="p-12 space-y-10 flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-orange-50 px-6 py-3 rounded-full border border-orange-100">
                      <Star className="w-5 h-5 fill-orange-500 text-orange-500" />
                      <span className="text-orange-700 font-black text-lg">{doc.rating || '5.0'}</span>
                    </div>
                    <span className="text-slate-400 text-sm font-black uppercase tracking-widest">{doc.review_count || 150}+ PATIENT REVIEWS</span>
                  </div>

                  <p className="text-slate-500 text-lg font-bold leading-relaxed border-l-4 border-slate-100 pl-6">
                    Specializing in advanced clinical pathways with a focus on patient-centric outcomes and precision diagnosis.
                  </p>

                  <Button 
                    onClick={() => navigate(`/doctors/${doc.user_id || doc.id}`)}
                    className="w-full bg-slate-950 hover:bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-[2rem] py-10 text-xl font-black transition-all shadow-2xl shadow-slate-950/20 active:scale-95 group-hover:shadow-red-600/30"
                  >
                    Clinical Profile
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== MOBILE APP SECTION ==================== */}
      <section className="py-48 bg-slate-950 overflow-hidden relative border-y border-white/5">
        <div className="absolute top-0 right-0 w-[70%] h-full bg-gradient-to-l from-orange-600/10 to-transparent blur-[150px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[50%] h-full bg-gradient-to-r from-red-600/10 to-transparent blur-[150px] rounded-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-40 items-center">
            <div className="space-y-16 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2.5 rounded-full text-white/60 font-black text-[10px] uppercase tracking-widest">
                <Smartphone className="w-4 h-4 text-orange-500" /> Native Experience
              </div>
              <h2 className="text-8xl md:text-9xl font-black text-white leading-[0.9] tracking-tighter">
                Unified <br /> control. <br /> <span className="text-orange-500">Perfected.</span>
              </h2>
              <p className="text-slate-400 text-3xl font-bold leading-relaxed max-w-xl mx-auto lg:mx-0">
                The HiDoctor ecosystem reimagined for your device. Elite care, in your pocket.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-10">
                <Button className="bg-white hover:bg-orange-50 text-slate-950 px-12 py-12 rounded-[2.5rem] flex items-center gap-6 group transition-all shadow-2xl shadow-white/5 active:scale-95">
                  <Download className="w-10 h-10 text-orange-600 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1.5">Download on</p>
                    <p className="text-2xl font-black">App Store</p>
                  </div>
                </Button>
                <Button className="bg-slate-900 hover:bg-slate-800 text-white border border-white/10 px-12 py-12 rounded-[2.5rem] flex items-center gap-6 group transition-all shadow-2xl active:scale-95">
                  <Smartphone className="w-10 h-10 text-red-600 group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1.5">Get it on</p>
                    <p className="text-2xl font-black">Play Store</p>
                  </div>
                </Button>
              </div>
            </div>
            <motion.div 
               initial={{ y: 200, opacity: 0, rotate: 10 }}
               whileInView={{ y: 0, opacity: 1, rotate: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 1.5, type: "spring" }}
               className="relative"
            >
              <div className="relative max-w-xl mx-auto group">
                <img src="/images/app_mockup.png" alt="Mobile App Ecosystem" className="w-full h-auto relative z-10 drop-shadow-[0_100px_150px_rgba(239,68,68,0.4)] group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-orange-600/30 blur-[150px] -z-10 rounded-full group-hover:bg-red-600/30 transition-colors duration-1000" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== BLOG PREVIEW ==================== */}
      <section id="blog" className="py-40 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-32 space-y-8">
             <h2 className="text-7xl font-black text-slate-950 tracking-tight leading-tight">Clinical Insights.</h2>
             <p className="text-slate-500 text-2xl font-bold max-w-2xl mx-auto leading-relaxed italic">"Knowledge is the first step to longevity. Explore our elite research hub."</p>
          </div>
          <div className="grid md:grid-cols-3 gap-16">
            {blogPreviews.map((post, idx) => (
              <motion.div key={idx} whileHover={{ y: -15 }} className="group cursor-pointer">
                <div className="aspect-[4/3] overflow-hidden rounded-[4rem] mb-12 relative shadow-[0_40px_80px_rgba(0,0,0,0.12)]">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute top-10 left-10">
                    <Badge className="bg-white/95 backdrop-blur text-slate-950 border-none font-black text-[11px] uppercase tracking-[0.2em] px-8 py-4 rounded-[1.5rem] shadow-2xl">{post.category}</Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent" />
                </div>
                <div className="space-y-8 px-6">
                  <p className="text-orange-600 text-[11px] font-black uppercase tracking-[0.4em]">{post.date}</p>
                  <h3 className="text-4xl font-black text-slate-950 group-hover:text-orange-600 transition-colors leading-tight tracking-tight">{post.title}</h3>
                  <p className="text-slate-500 text-xl font-bold leading-relaxed line-clamp-2">{post.excerpt}</p>
                  <Link to="/blog" className="inline-flex items-center text-slate-950 font-black gap-4 group/link text-sm uppercase tracking-[0.3em]">
                    Read Full Study <ArrowRight className="w-6 h-6 group-hover/link:translate-x-3 transition-transform text-red-600" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section id="faq" className="py-40 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-32 space-y-8">
            <h2 className="text-7xl font-black text-slate-950 tracking-tight leading-tight">Patient Support.</h2>
            <p className="text-slate-500 text-2xl font-bold italic leading-relaxed">"Every query answered with clinical precision."</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-[3rem] px-10 border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all mb-6">
                <FAQAccordion faq={faq} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
