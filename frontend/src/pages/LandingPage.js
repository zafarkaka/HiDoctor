import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
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
  Users,
  Mail,
  Zap,
  TrendingUp,
  Award,
  Plus
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
];

const MedicalIllustration = () => (
  <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full mesh-orange-red opacity-10" />
    <motion.div 
      animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.1, 0.05] }}
      transition={{ duration: 15, repeat: Infinity }}
      className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-500 blur-[150px] rounded-full"
    />
  </div>
);

const FloatingBadge = ({ icon: Icon, text, delay = 0, className }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.8, type: "spring" }}
    className={`absolute glass-premium px-3 py-2 rounded-2xl flex items-center gap-3 shadow-lg border-white/60 z-20 animate-float-complex ${className}`}
  >
    <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white">
      <Icon className="w-4 h-4" />
    </div>
    <span className="text-[10px] font-black text-slate-900 tracking-tight whitespace-nowrap">{text}</span>
  </motion.div>
);

const AdBanner = ({ ads }) => {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => setCurrent((prev) => (prev + 1) % ads.length), 5000);
    return () => clearInterval(timer);
  }, [ads.length]);

  if (!ads || ads.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
      <div className="relative rounded-[2rem] overflow-hidden shadow-xl border border-orange-100 bg-white w-fit max-w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col w-fit max-w-full mx-auto"
          >
            <div className="flex justify-center bg-slate-50 items-center overflow-hidden">
              <img src={ads[current].image_url} alt="Ad" className="w-auto h-auto max-w-full max-h-[300px] md:max-h-[400px] object-contain block" />
            </div>
            <div className="p-6 md:p-8 space-y-3 flex flex-col items-center text-center border-t border-slate-100 w-full max-w-[500px] mx-auto">
              <Badge className="bg-orange-600 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full mb-1">Featured Offer</Badge>
              <h3 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tighter leading-none">{ads[current].title}</h3>
              {ads[current].description && <p className="text-slate-500 text-sm font-bold italic line-clamp-2">{ads[current].description}</p>}
              <Button onClick={() => ads[current].redirect_url && window.open(ads[current].redirect_url, '_blank')} className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg px-8 py-3 font-black text-[10px] uppercase tracking-widest shadow-lg mt-2">
                Claim Now
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [email, setEmail] = useState('');

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

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Successfully subscribed to Clinical Insights!');
    setEmail('');
  };

  const blogPreviews = [
    {
      title: "Understanding Modern Telehealth",
      excerpt: "How digital medicine is revolutionizing the patient experience in 2026.",
      image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=400&fit=crop",
      category: "Innovation",
      date: "Oct 24, 2025"
    },
    {
      title: "The Future of Preventive Care",
      excerpt: "New strategies to stay ahead of your health with early diagnostic tools.",
      image: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&h=400&fit=crop",
      category: "Clinical",
      date: "Oct 20, 2025"
    },
    {
      title: "Holistic Health Trends",
      excerpt: "Combining clinical excellence with wellness for a complete life approach.",
      image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&h=400&fit=crop",
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
        <button onClick={() => setIsOpen(!isOpen)} className="w-full py-5 flex justify-between items-center text-left hover:text-orange-600 transition-colors group">
          <span className="text-base font-black text-slate-900 group-hover:text-orange-600 tracking-tight">{faq.question}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180 border-orange-600 text-orange-600' : ''}`} />
        </button>
        <motion.div initial={false} animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }} className="overflow-hidden">
          <p className="pb-5 text-slate-500 text-sm font-medium leading-relaxed">{faq.answer}</p>
        </motion.div>
      </div>
    );
  };

  return (
    <div id="top" className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden scale-[0.92] origin-top">
      <Navbar />

      {/* ==================== HERO SECTION (Condensed) ==================== */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <MedicalIllustration />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 px-4 py-1.5 rounded-full">
                <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-ping" />
                <span className="text-orange-700 text-[9px] font-black uppercase tracking-widest">Clinical Standard 2026</span>
              </div>
              <h1 className="text-6xl md:text-7xl font-black text-slate-950 leading-none tracking-tighter">
                Health care <br /> <span className="text-orange-600">inspired.</span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed max-w-md font-bold italic border-l-4 border-orange-500/30 pl-5">
                "We redesign your future health through precision medicine and elite expertise."
              </p>
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center bg-white p-2 rounded-2xl shadow-xl border border-orange-100/50 max-w-xl group">
                <div className="flex-1 flex items-center px-5 w-full border-b sm:border-b-0 sm:border-r border-slate-100 py-3 sm:py-0">
                  <Search className="w-5 h-5 text-orange-600 mr-3" />
                  <input type="text" placeholder="Doctor, specialty..." className="w-full bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 font-black text-base" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
                </div>
                <div className="flex-1 flex items-center px-5 w-full py-3 sm:py-0">
                  <MapPin className="w-5 h-5 text-red-600 mr-3" />
                  <input type="text" placeholder="Near you" className="w-full bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 font-black text-base" value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} />
                </div>
                <Button type="submit" className="w-full sm:w-auto bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-xl px-8 py-4 text-sm font-black shadow-lg transition-all">Explore</Button>
              </form>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative hidden lg:block">
              <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-white max-w-md ml-auto">
                <img src="/images/hero_doctor_new.png" alt="Doctor" className="w-full h-auto" />
              </div>
              <FloatingBadge icon={CheckCircle2} text="Elite Vetted" className="-top-4 -right-4" />
              <FloatingBadge icon={Video} text="HD Telehealth" className="top-1/3 -left-8" />
              <FloatingBadge icon={Smartphone} text="Health App" className="-bottom-4 left-1/4" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== ADS CAROUSEL ==================== */}
      <AdBanner ads={ads} />

      {/* ==================== TRUST STATS (Compact) ==================== */}
      <section className="py-12 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Total Patients', value: '50k+', icon: Users },
              { label: 'Top Doctors', value: '1,200+', icon: Stethoscope },
              { label: 'Success Rate', value: '99.9%', icon: Star },
              { label: 'Expert Care', value: '24/7', icon: Shield }
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                   <stat.icon className="w-5 h-5 text-orange-500" />
                   <span className="text-3xl font-black tracking-tighter text-white">{stat.value}</span>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SPECIALTIES (Compact) ==================== */}
      <section id="specialties" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-4xl font-black text-slate-950 tracking-tight">Curated Excellence.</h2>
            <Link to="/doctors" className="text-orange-600 font-black text-xs uppercase tracking-widest hover:translate-x-2 transition-transform inline-flex items-center gap-2">Full Directory <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {specialties.map((spec, idx) => (
              <motion.div key={idx} whileHover={{ y: -5 }} onClick={() => navigate(`/doctors?specialty=${spec.name}`)} className="cursor-pointer bg-slate-50 border border-slate-100 p-6 rounded-[2rem] hover:bg-white hover:shadow-xl transition-all">
                <div className={`w-12 h-12 rounded-xl ${spec.color} flex items-center justify-center mb-4 shadow-sm`}><spec.icon className="w-6 h-6" /></div>
                <h3 className="text-lg font-black text-slate-950 mb-1">{spec.name}</h3>
                <p className="text-[10px] text-slate-500 font-bold opacity-70">World-class diagnostics.</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS (NEW/RESTORED) ==================== */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
            <h2 className="text-4xl font-black text-slate-950 tracking-tight">Simplified Path to Care.</h2>
            <div className="grid md:grid-cols-3 gap-8">
               {[
                 { step: '01', title: 'Find Specialist', desc: 'Browse our elite network of verified medical practitioners.', icon: Search },
                 { step: '02', title: 'Select Schedule', desc: 'Choose a time slot that aligns with your professional routine.', icon: Calendar },
                 { step: '03', title: 'Consult Now', desc: 'Experience world-class care via HD video or in-clinic visit.', icon: Video }
               ].map((item, i) => (
                 <div key={i} className="relative p-8 bg-white rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-lg transition-all">
                    <span className="absolute top-6 right-8 text-4xl font-black text-slate-100 group-hover:text-orange-100 transition-colors">{item.step}</span>
                    <item.icon className="w-10 h-10 text-orange-600 mb-6" />
                    <h4 className="text-xl font-black text-slate-950 mb-3">{item.title}</h4>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">{item.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* ==================== TOP DOCTORS (Compact) ==================== */}
      <section id="doctors" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-slate-950 tracking-tight text-center mb-12">Elite Clinical Network.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {loadingDoctors ? [1,2,3].map(i => <Skeleton key={i} className="h-80 rounded-[2.5rem] bg-slate-100" />) : topDoctors.slice(0, 3).map((doc, idx) => (
              <motion.div key={idx} whileHover={{ y: -8 }} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg overflow-hidden flex flex-col group">
                <div className="relative h-56 overflow-hidden">
                  <img src={doc.profile_image || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=800&fit=crop`} alt={doc.full_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
                  <div className="absolute bottom-5 left-6">
                    <p className="text-orange-400 text-[9px] font-black uppercase tracking-widest mb-1">{doc.specialties?.[0] || 'Specialist'}</p>
                    <h3 className="text-xl font-black text-white tracking-tight">{doc.full_name}</h3>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1 rounded-full"><Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" /><span className="text-orange-700 font-black text-xs">{doc.rating || '5.0'}</span></div>
                    <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{doc.review_count || 120}+ REVIEWS</span>
                  </div>
                  <Button onClick={() => navigate(`/doctors/${doc.user_id || doc.id}`)} className="w-full bg-slate-950 hover:bg-orange-600 text-white rounded-xl py-5 text-xs font-black transition-all">View Profile</Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== MOBILE APP (Condensed) ==================== */}
      <section id="app" className="py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <h2 className="text-5xl md:text-6xl font-black leading-none tracking-tighter">Unified control. <br /> <span className="text-orange-600">Perfected.</span></h2>
            <p className="text-slate-400 text-lg font-bold leading-relaxed max-w-md mx-auto lg:mx-0">The HiDoctor ecosystem reimagined for your device.</p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Button 
                onClick={() => window.open('https://play.google.com/store/apps/details?id=com.limratech.hidoctor&pcampaignid=web_share', '_blank')}
                className="bg-slate-900 border border-white/10 text-white px-6 py-6 rounded-xl flex items-center gap-3 transition-all active:scale-95"
              >
                <Smartphone className="w-5 h-5 text-red-600" />
                <span className="text-sm font-black">Play Store</span>
              </Button>
            </div>
          </div>
          <div className="flex-1 relative max-w-xs mx-auto lg:ml-auto"><img src="/images/find_doctor_mockup.png" alt="App" className="w-full h-auto drop-shadow-2xl" /></div>
        </div>
      </section>

      {/* ==================== BLOG & FAQ (Side by Side) ==================== */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">Clinical Insights.</h2>
            <div className="space-y-6">
              {blogPreviews.slice(0, 2).map((post, idx) => (
                <Link key={idx} to="/blog" className="flex gap-4 group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md flex-shrink-0"><img src={post.image} alt="Blog" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /></div>
                  <div className="space-y-1">
                    <p className="text-orange-600 text-[8px] font-black uppercase tracking-widest">{post.category} • {post.date}</p>
                    <h3 className="text-lg font-black text-slate-950 group-hover:text-orange-600 transition-colors leading-tight">{post.title}</h3>
                    <p className="text-xs text-slate-500 font-bold line-clamp-1">{post.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-slate-950 tracking-tight">Support.</h2>
            <div className="space-y-1">{faqs.map((faq, idx) => <FAQAccordion key={idx} faq={faq} />)}</div>
          </div>
        </div>
      </section>

      {/* ==================== NEWSLETTER (Compact) ==================== */}
      <section className="py-16 bg-orange-600 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <h2 className="text-4xl font-black text-white tracking-tighter">Stay Clinically Informed.</h2>
          <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
             <input type="email" placeholder="Clinical email..." className="flex-1 bg-white/10 border border-white/20 rounded-xl px-6 py-4 text-white placeholder:text-orange-200 outline-none font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
             <Button type="submit" className="bg-white text-orange-600 rounded-xl px-8 py-4 font-black text-sm active:scale-95 transition-all">Subscribe</Button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
}
