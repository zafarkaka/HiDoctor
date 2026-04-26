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
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden scale-[0.92] origin-top">
      <Navbar />

      {/* ==================== HERO HEADER (Condensed) ==================== */}
      <section className="relative pt-16 pb-20 bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 mesh-orange-red opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 px-5 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
              Live Network Status: Optimizing
            </Badge>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
              Find <span className="text-shine">Excellence.</span>
            </h1>
            <p className="text-slate-400 text-lg font-bold max-w-xl mx-auto leading-relaxed italic opacity-80">
              "Access the world's most prestigious clinical specialists with a single click."
            </p>

            {/* Compact Search Bar */}
            <div className="max-w-4xl mx-auto mt-10 p-2 bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center gap-1">
                <div className="flex-1 flex items-center px-6 py-4 gap-4 border-b md:border-b-0 md:border-r border-white/10">
                   <Search className="w-6 h-6 text-orange-500 animate-pulse" />
                   <input 
                    type="text" 
                    placeholder="Search name, clinic, or specialty..." 
                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-500 font-black text-lg"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                   />
                </div>
                <div className="flex-1 flex items-center px-6 py-4 gap-4">
                   <MapPin className="w-6 h-6 text-red-500" />
                   <select 
                    className="w-full bg-transparent border-none focus:ring-0 text-white font-black text-lg appearance-none cursor-pointer"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                   >
                     <option value="all" className="bg-slate-900 text-white">All Locations</option>
                     {availableLocations.map(loc => (
                       <option key={loc} value={loc} className="bg-slate-900 text-white">{loc}</option>
                     ))}
                   </select>
                </div>
                <Button className="w-full md:w-auto bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-xl px-12 py-6 text-lg font-black shadow-xl active:scale-95 transition-all">
                  Refresh
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== MAIN CONTENT GRID (Condensed) ==================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-[320px,1fr] gap-10 items-start">
          
          {/* STICKY SIDEBAR FILTERS (Condensed) */}
          <aside className="sticky top-24 space-y-8 sidebar-scroll">
            
            {/* AI Assistant Card */}
            <motion.div 
              whileHover={{ scale: 1.01 }}
              className="bg-slate-950 rounded-[2.5rem] p-8 border border-white/10 shadow-xl relative overflow-hidden group"
            >
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                   <Bot className="w-6 h-6 text-white animate-bounce" />
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">AI Assistant</h3>
                <p className="text-slate-400 font-bold text-sm leading-relaxed italic opacity-80">"Feeling unusual? Our AI will match you with the perfect specialist."</p>
                <Button 
                  onClick={() => setShowAiModal(true)}
                  className="w-full bg-white hover:bg-orange-50 text-slate-950 rounded-xl py-5 font-black text-[10px] uppercase tracking-widest active:scale-95"
                >
                  Start Consultation
                </Button>
              </div>
            </motion.div>

            {/* Filter Section */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-lg space-y-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Filter className="w-4 h-4 text-orange-600" />
                  </div>
                  <h4 className="text-xl font-black text-slate-950 tracking-tight">Filters</h4>
                </div>
                <button 
                  onClick={() => setFilters({ search: '', specialty: '', consultation_type: '', min_fee: '', max_fee: '', location: '', page: 1 })}
                  className="text-[9px] font-black text-slate-400 hover:text-red-600 uppercase tracking-widest"
                >
                  Reset
                </button>
              </div>

              {/* Specialty Grid Selection */}
              <div className="space-y-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Specialty</label>
                <div className="grid grid-cols-1 gap-2">
                  {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'].map(spec => (
                    <button
                      key={spec}
                      onClick={() => handleFilterChange('specialty', spec)}
                      className={`flex items-center justify-between px-5 py-3 rounded-xl border transition-all font-black text-xs ${
                        filters.specialty === spec 
                        ? 'bg-orange-600 border-orange-600 text-white shadow-md' 
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-orange-300'
                      }`}
                    >
                      {spec}
                      {filters.specialty === spec && <ChevronRight className="w-3 h-3" />}
                    </button>
                  ))}
                  <Select value={filters.specialty} onValueChange={(v) => handleFilterChange('specialty', v)}>
                    <SelectTrigger className="rounded-xl h-12 border-slate-100 bg-slate-50 font-black text-xs text-slate-600">
                      <SelectValue placeholder="More Specialties..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 font-black text-xs">
                      {specialties.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Consultation Type */}
              <div className="space-y-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Mode of Care</label>
                <div className="flex flex-col gap-3">
                  {[
                    { id: 'video', label: 'Video', icon: Video },
                    { id: 'hospital', label: 'In-Clinic', icon: Home }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => handleFilterChange('consultation_type', type.id)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        filters.consultation_type === type.id
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-white'
                      }`}
                    >
                      <type.icon className={`w-5 h-5 ${filters.consultation_type === type.id ? 'text-red-600' : 'text-slate-400'}`} />
                      <span className="font-black text-xs tracking-tight">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* DOCTOR RESULTS AREA (Condensed) */}
          <main className="space-y-8">
            
            {/* Active Filters Bar */}
            <div className="flex items-center justify-between bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
               <div className="flex items-center gap-4">
                  <Badge className="bg-orange-50 text-orange-600 border-orange-100 font-black px-4 py-1.5 rounded-full text-[9px] uppercase tracking-wider">
                     {doctors.length} Verified Specialists
                  </Badge>
               </div>
               <div className="flex gap-4">
                  <Button variant="ghost" className="rounded-lg font-black text-[10px] text-slate-400 hover:text-orange-600 tracking-widest">MAP</Button>
                  <Button variant="ghost" className="rounded-lg font-black text-[10px] text-slate-400 hover:text-orange-600 tracking-widest">SORT</Button>
               </div>
            </div>

            {/* Doctor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {loading ? (
                [1,2,3,4].map(i => <Skeleton key={i} className="h-96 rounded-[3rem] bg-slate-50" />)
              ) : doctors.length > 0 ? (
                doctors.map((doc, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -8 }}
                    className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col group relative"
                  >
                    {/* Header Image Part */}
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={doc.profile_image || `https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&h=800&fit=crop`} 
                        alt={doc.full_name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute top-6 right-6">
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-white flex items-center gap-2">
                           <Shield className="w-3 h-3 text-orange-400" />
                           <span className="text-[8px] font-black uppercase tracking-widest">Verified</span>
                        </div>
                      </div>
                      <div className="absolute bottom-6 left-8">
                         <h3 className="text-2xl font-black text-white tracking-tight leading-none">{doc.full_name}</h3>
                      </div>
                    </div>

                    {/* Content Part */}
                    <div className="p-8 space-y-6 flex-1 flex flex-col">
                       <div className="flex items-center justify-between">
                          <div className="space-y-1">
                             <p className="text-orange-600 font-black text-[10px] uppercase tracking-widest">{doc.specialties?.[0] || 'Specialist'}</p>
                             <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-500 font-black text-xs tracking-tight">{doc.location}</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-2 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                             <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
                             <span className="text-orange-700 font-black text-sm">{doc.rating || '5.0'}</span>
                          </div>
                       </div>

                       <div className="flex gap-3">
                          <Button 
                            onClick={() => navigate(`/doctors/${doc.user_id || doc.id}`)}
                            className="flex-1 bg-slate-950 hover:bg-orange-600 text-white rounded-xl py-6 text-sm font-black transition-all active:scale-95 shadow-lg"
                          >
                            Profile
                          </Button>
                          <Button className="w-14 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl border border-orange-200">
                             <Video className="w-5 h-5" />
                          </Button>
                       </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center space-y-6 bg-slate-50 rounded-[3rem] border border-slate-100">
                   <h3 className="text-3xl font-black text-slate-950 tracking-tight">No Specialists Found</h3>
                   <Button 
                    onClick={() => setFilters({ search: '', specialty: '', consultation_type: '', min_fee: '', max_fee: '', location: '', page: 1 })}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl px-8 py-4 font-black"
                   >
                     Clear Filters
                   </Button>
                </div>
              )}
            </div>

            {/* Pagination (Condensed) */}
            {totalPages > 1 && (
               <div className="flex justify-center items-center gap-3 pt-8">
                  <Button 
                    disabled={filters.page === 1}
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                    className="w-12 h-12 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-orange-600"
                  >
                     <ChevronRight className="w-5 h-5 rotate-180" />
                  </Button>
                  <div className="flex gap-2 text-xs font-black">
                     Page {filters.page} of {totalPages}
                  </div>
                  <Button 
                    disabled={filters.page === totalPages}
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                    className="w-12 h-12 rounded-full bg-white border border-slate-100 text-slate-400 hover:text-orange-600"
                  >
                     <ChevronRight className="w-5 h-5" />
                  </Button>
               </div>
            )}
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
