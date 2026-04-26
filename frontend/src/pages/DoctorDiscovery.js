import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navbar, Footer } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Search,
  Star,
  MapPin,
  Video,
  Filter,
  X,
  Clock,
  Bot,
  Loader2,
  Home,
  Map as MapIcon,
  Globe,
  Users,
  ArrowRight,
  Shield,
  Stethoscope,
  ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function DoctorDiscovery() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const { token } = useAuth();

  // AI State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSymptoms, setAiSymptoms] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(null);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    specialty: searchParams.get('specialty') || '',
    consultation_type: searchParams.get('type') || '',
    min_fee: '',
    max_fee: '',
    location: searchParams.get('location') || '',
    page: 1
  });
  const [availableLocations, setAvailableLocations] = useState(['Bangalore', 'Chennai', 'Hyderabad', 'Kochi', 'Coimbatore', 'Madurai', 'Mysore', 'Vaniyambadi']);

  useEffect(() => {
    fetchSpecialties();
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [filters]);

  const fetchSpecialties = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/specialties`);
      setSpecialties(response.data.specialties);
    } catch (error) {
      console.error('Error fetching specialties:', error);
    }
  };

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.specialty && filters.specialty !== 'all') params.append('specialty', filters.specialty);
      if (filters.location && filters.location !== 'all') params.append('location', filters.location);
      if (filters.consultation_type && filters.consultation_type !== 'all') params.append('consultation_type', filters.consultation_type);
      if (filters.min_fee) params.append('min_fee', filters.min_fee);
      if (filters.max_fee) params.append('max_fee', filters.max_fee);
      params.append('page', filters.page);

      const response = await axios.get(`${API_URL}/api/doctors?${params}`);
      setDoctors(response.data.doctors);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleAiInference = async () => {
    if (!aiSymptoms.trim()) return;
    setAiLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/ai/recommend-specialty`, { symptoms: aiSymptoms });
      setAiRecommendation(response.data.recommendation);
      handleFilterChange('specialty', response.data.recommendation.specialty);
      setShowAiModal(false);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden">
      <Navbar />

      {/* ==================== HERO HEADER ==================== */}
      <section className="relative pt-28 pb-40 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 mesh-orange-red opacity-30" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-600/20 to-transparent blur-[120px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest">
              Live Network Status: Optimizing
            </Badge>
            <h1 className="text-7xl md:text-8xl font-black text-white tracking-tighter leading-none">
              Find <span className="text-shine">Excellence.</span>
            </h1>
            <p className="text-slate-400 text-2xl font-bold max-w-2xl mx-auto leading-relaxed italic">
              "Access the world's most prestigious clinical specialists with a single click."
            </p>

            {/* Advanced Search Bar (Large) */}
            <div className="max-w-5xl mx-auto mt-16 p-3 bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center gap-2">
                <div className="flex-1 flex items-center px-8 py-5 gap-5 border-b md:border-b-0 md:border-r border-white/10">
                   <Search className="w-8 h-8 text-orange-500 animate-pulse" />
                   <input 
                    type="text" 
                    placeholder="Search name, clinic, or specialty..." 
                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 font-black text-xl"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                   />
                </div>
                <div className="flex-1 flex items-center px-8 py-5 gap-5">
                   <MapPin className="w-8 h-8 text-red-500" />
                   <select 
                    className="w-full bg-transparent border-none focus:ring-0 text-white font-black text-xl appearance-none cursor-pointer"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                   >
                     <option value="all" className="bg-slate-900 text-white">All Locations</option>
                     {availableLocations.map(loc => (
                       <option key={loc} value={loc} className="bg-slate-900 text-white">{loc}</option>
                     ))}
                   </select>
                </div>
                <Button className="w-full md:w-auto bg-gradient-to-br from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-[2rem] px-16 py-8 text-xl font-black shadow-2xl active:scale-95 transition-all shimmer-btn">
                  Refresh Grid
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== MAIN CONTENT GRID ==================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-[380px,1fr] gap-16 items-start">
          
          {/* STICKY SIDEBAR FILTERS */}
          <aside className="sticky top-32 space-y-12 sidebar-scroll">
            
            {/* AI Assistant Card */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="bg-slate-950 rounded-[3rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/30">
                   <Bot className="w-8 h-8 text-white animate-bounce" />
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight leading-none">Diagnostic Assistant</h3>
                <p className="text-slate-400 font-bold text-base leading-relaxed italic">"Feeling unusual? Our clinical AI will match you with the perfect specialist based on your symptoms."</p>
                <Button 
                  onClick={() => setShowAiModal(true)}
                  className="w-full bg-white hover:bg-orange-50 text-slate-950 rounded-2xl py-6 font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  Start AI Consultation
                </Button>
              </div>
            </motion.div>

            {/* Filter Section */}
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-12">
              <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Filter className="w-5 h-5 text-orange-600" />
                  </div>
                  <h4 className="text-2xl font-black text-slate-950 tracking-tight">Precision Filters</h4>
                </div>
                <button 
                  onClick={() => setFilters({ search: '', specialty: '', consultation_type: '', min_fee: '', max_fee: '', location: '', page: 1 })}
                  className="text-xs font-black text-slate-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                >
                  Reset
                </button>
              </div>

              {/* Specialty Grid Selection */}
              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Select Specialty</label>
                <div className="grid grid-cols-1 gap-3">
                  {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology'].map(spec => (
                    <button
                      key={spec}
                      onClick={() => handleFilterChange('specialty', spec)}
                      className={`flex items-center justify-between px-6 py-4 rounded-2xl border transition-all font-black text-sm tracking-tight ${
                        filters.specialty === spec 
                        ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20 scale-[1.02]' 
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-orange-300'
                      }`}
                    >
                      {spec}
                      {filters.specialty === spec && <ChevronRight className="w-4 h-4" />}
                    </button>
                  ))}
                  <Select value={filters.specialty} onValueChange={(v) => handleFilterChange('specialty', v)}>
                    <SelectTrigger className="rounded-2xl h-16 border-slate-100 bg-slate-50 font-black text-slate-600 focus:ring-orange-500">
                      <SelectValue placeholder="More Specialties..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-slate-100 font-black text-slate-600">
                      {specialties.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Consultation Type */}
              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Mode of Care</label>
                <div className="flex flex-col gap-4">
                  {[
                    { id: 'video', label: 'Video Consultation', icon: Video },
                    { id: 'hospital', label: 'In-Clinic Visit', icon: Home }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => handleFilterChange('consultation_type', type.id)}
                      className={`flex items-center gap-5 p-6 rounded-2xl border transition-all ${
                        filters.consultation_type === type.id
                        ? 'bg-red-50 border-red-200 text-red-700 shadow-sm'
                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white'
                      }`}
                    >
                      <type.icon className={`w-6 h-6 ${filters.consultation_type === type.id ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="font-black text-sm tracking-tight">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* DOCTOR RESULTS AREA */}
          <main className="space-y-12">
            
            {/* Active Filters Bar */}
            <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
               <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Active Results:</span>
                  <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-black px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider">
                     {doctors.length} Verified Specialists
                  </Badge>
               </div>
               <div className="flex gap-4">
                  <Button variant="ghost" className="rounded-xl font-black text-xs text-slate-400 hover:text-orange-600 tracking-widest">MAP VIEW</Button>
                  <Button variant="ghost" className="rounded-xl font-black text-xs text-slate-400 hover:text-orange-600 tracking-widest">SORT: RATING</Button>
               </div>
            </div>

            {/* Doctor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {loading ? (
                [1,2,3,4].map(i => <Skeleton key={i} className="h-[550px] rounded-[4rem] bg-slate-50" />)
              ) : doctors.length > 0 ? (
                doctors.map((doc, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ y: -15 }}
                    className="bg-white rounded-[4.5rem] border border-slate-100 shadow-[0_30px_70px_rgba(239,68,68,0.06)] overflow-hidden flex flex-col group relative"
                  >
                    {/* Header Image Part */}
                    <div className="relative h-80 overflow-hidden">
                      <img 
                        src={doc.profile_image || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=800&fit=crop`} 
                        alt={doc.full_name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                      <div className="absolute top-8 right-8">
                        <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 text-white flex items-center gap-2">
                           <Shield className="w-4 h-4 text-orange-400" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Verified Elite</span>
                        </div>
                      </div>
                      <div className="absolute bottom-8 left-10">
                         <div className="flex items-center gap-3 mb-2">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-green-400 text-[10px] font-black uppercase tracking-[0.2em]">Ready for Consultation</span>
                         </div>
                         <h3 className="text-4xl font-black text-white tracking-tight leading-none">{doc.full_name}</h3>
                      </div>
                    </div>

                    {/* Content Part */}
                    <div className="p-10 space-y-10 flex-1 flex flex-col">
                       <div className="flex items-center justify-between">
                          <div className="space-y-1">
                             <p className="text-orange-600 font-black text-xs uppercase tracking-widest">{doc.specialties?.[0] || 'Premium Specialist'}</p>
                             <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-500 font-black text-sm tracking-tight">{doc.location}</span>
                             </div>
                          </div>
                          <div className="flex flex-col items-end">
                             <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full border border-orange-100">
                                <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                                <span className="text-orange-700 font-black text-base">{doc.rating || '5.0'}</span>
                             </div>
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{doc.review_count || 120}+ REVIEWS</span>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-50">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Consultation Fee</p>
                             <p className="text-2xl font-black text-slate-950 tracking-tighter">₹{doc.consultation_fee || '1,500'}</p>
                          </div>
                          <div className="space-y-1 text-right">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Avg. Waiting</p>
                             <p className="text-2xl font-black text-slate-950 tracking-tighter">15 Mins</p>
                          </div>
                       </div>

                       <div className="flex gap-4">
                          <Button 
                            onClick={() => navigate(`/doctors/${doc.user_id || doc.id}`)}
                            className="flex-1 bg-slate-950 hover:bg-orange-600 text-white rounded-[2rem] py-8 text-lg font-black transition-all active:scale-95 shadow-xl shadow-slate-950/10 group-hover:shadow-orange-600/30"
                          >
                            Clinical Profile
                          </Button>
                          <Button className="w-20 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-[2rem] border border-orange-200">
                             <Video className="w-6 h-6" />
                          </Button>
                       </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-40 text-center space-y-8 bg-slate-50 rounded-[4rem] border border-slate-100">
                   <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl">
                      <Search className="w-10 h-10 text-slate-300" />
                   </div>
                   <h3 className="text-4xl font-black text-slate-950 tracking-tight">No Specialists Found</h3>
                   <p className="text-slate-400 text-xl font-bold max-w-md mx-auto leading-relaxed italic">"Try adjusting your filters to find the ideal elite practitioner for your needs."</p>
                   <Button 
                    onClick={() => setFilters({ search: '', specialty: '', consultation_type: '', min_fee: '', max_fee: '', location: '', page: 1 })}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-10 py-4 font-black"
                   >
                     Clear All Filters
                   </Button>
                </div>
              )}
            </div>

            {/* Pagination with extra pizzazz */}
            {totalPages > 1 && (
               <div className="flex justify-center items-center gap-4 pt-12">
                  <Button 
                    disabled={filters.page === 1}
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                    className="w-20 h-20 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-orange-600 hover:border-orange-200 shadow-sm"
                  >
                     <ChevronRight className="w-8 h-8 rotate-180" />
                  </Button>
                  <div className="flex gap-2">
                     {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handleFilterChange('page', i + 1)}
                          className={`w-12 h-12 rounded-2xl font-black text-sm transition-all ${
                            filters.page === i + 1 
                            ? 'bg-orange-600 text-white shadow-lg' 
                            : 'bg-white text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                           {i + 1}
                        </button>
                     ))}
                  </div>
                  <Button 
                    disabled={filters.page === totalPages}
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                    className="w-20 h-20 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-orange-600 hover:border-orange-200 shadow-sm"
                  >
                     <ChevronRight className="w-8 h-8" />
                  </Button>
               </div>
            )}
          </main>
        </div>
      </div>

      {/* ==================== AI MODAL ==================== */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAiModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-2xl bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="bg-slate-950 p-12 text-center space-y-6 relative overflow-hidden">
                <div className="absolute inset-0 mesh-orange-red opacity-20" />
                <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl relative z-10 animate-bounce">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-5xl font-black text-white tracking-tighter leading-none relative z-10">AI Diagnostic Protocol</h3>
                <p className="text-slate-400 font-bold text-xl leading-relaxed italic relative z-10">"Describe your clinical observations below for specialized matching."</p>
                <button onClick={() => setShowAiModal(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">
                  <X className="w-8 h-8" />
                </button>
              </div>
              <div className="p-12 space-y-8">
                <textarea 
                  className="w-full h-48 bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-black text-xl text-slate-900 placeholder:text-slate-400 outline-none"
                  placeholder="E.g., I have persistent chest pressure and mild shortness of breath..."
                  value={aiSymptoms}
                  onChange={(e) => setAiSymptoms(e.target.value)}
                />
                <Button 
                  onClick={handleAiInference}
                  disabled={aiLoading}
                  className="w-full bg-slate-950 hover:bg-orange-600 text-white rounded-[2rem] py-8 text-2xl font-black shadow-2xl active:scale-95 transition-all"
                >
                  {aiLoading ? <Loader2 className="w-8 h-8 animate-spin" /> : "Synthesize Clinical Recommendation"}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
