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
  Home
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function DoctorDiscovery() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
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
    page: 1
  });

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
      if (filters.consultation_type && filters.consultation_type !== 'all') params.append('consultation_type', filters.consultation_type);
      if (filters.min_fee) params.append('min_fee', filters.min_fee);
      if (filters.max_fee) params.append('max_fee', filters.max_fee);
      params.append('page', filters.page);

      const response = await axios.get(`${API_URL}/api/doctors?${params}`);
      setDoctors(response.data.doctors);
      setTotalPages(response.data.pages);
      setAiRecommendation(null);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAiSearch = async () => {
    if (!aiSymptoms.trim()) return;
    setAiLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/ai/recommend`,
        { symptoms: aiSymptoms },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDoctors(response.data.doctors);
      setAiRecommendation(response.data.recommendation);
      setShowAiModal(false);
      setAiSymptoms('');
    } catch (error) {
      console.error('AI search failed:', error);
      // Optional: Add toast error
    } finally {
      setAiLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      specialty: '',
      consultation_type: '',
      min_fee: '',
      max_fee: '',
      page: 1
    });
    setSearchParams({});
  };

  const hasActiveFilters = (filters.specialty && filters.specialty !== 'all') ||
    (filters.consultation_type && filters.consultation_type !== 'all') ||
    filters.min_fee || filters.max_fee;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Find Your Doctor</h1>
          <p className="text-muted-foreground">Browse our network of verified healthcare professionals</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search doctors, specialties, clinics..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="pl-10 h-12"
                data-testid="doctor-search-input"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 ${hasActiveFilters ? 'border-primary text-primary' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && <Badge className="ml-1">{[filters.specialty, filters.consultation_type, filters.min_fee, filters.max_fee].filter(Boolean).length}</Badge>}
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md"
              onClick={() => setShowAiModal(true)}
            >
              <Bot className="w-4 h-4" />
              AI Match
            </Button>
          </div>

          {/* AI Modal Overlay (Simulated Dialog) */}
          {showAiModal && (
            <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center p-4">
              <Card className="w-full max-w-lg border-border/50 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Bot className="w-6 h-6 text-primary" />
                      AI Symptom Checker
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => setShowAiModal(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Describe your symptoms, and our AI will recommend the best specialist for you.
                  </p>
                  <Input
                    placeholder="E.g., I have a severe headache and nausea since morning..."
                    value={aiSymptoms}
                    onChange={(e) => setAiSymptoms(e.target.value)}
                    className="mb-4 h-24 whitespace-normal align-top"
                    multiple
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAiModal(false)}>Cancel</Button>
                    <Button onClick={handleAiSearch} disabled={aiLoading || !aiSymptoms.trim()}>
                      {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Bot className="w-4 h-4 mr-2" />}
                      Find Matches
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filter Panel */}
          {showFilters && (
            <Card className="border-border/50 animate-fadeIn">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Specialty</label>
                    <Select
                      value={filters.specialty}
                      onValueChange={(value) => setFilters({ ...filters, specialty: value, page: 1 })}
                    >
                      <SelectTrigger data-testid="specialty-filter">
                        <SelectValue placeholder="All specialties" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All specialties</SelectItem>
                        {specialties.map(spec => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Consultation Type</label>
                    <Select
                      value={filters.consultation_type}
                      onValueChange={(value) => setFilters({ ...filters, consultation_type: value, page: 1 })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="in_person">In-person</SelectItem>
                        <SelectItem value="telehealth">Telehealth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Min Fee ($)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.min_fee}
                      onChange={(e) => setFilters({ ...filters, min_fee: e.target.value, page: 1 })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Max Fee ($)</label>
                    <Input
                      type="number"
                      placeholder="500"
                      value={filters.max_fee}
                      onChange={(e) => setFilters({ ...filters, max_fee: e.target.value, page: 1 })}
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-4 gap-1 text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                    Clear all filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Recommendation Banner */}
          {aiRecommendation && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 animate-fadeIn">
              <div className="flex items-start gap-3">
                <Bot className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-primary mb-1">AI Recommendation</h3>
                  <p className="text-sm text-foreground/80">{aiRecommendation}</p>
                  <Button
                    variant="link"
                    className="px-0 h-auto mt-2 text-primary"
                    onClick={() => { setAiRecommendation(null); fetchDoctors(); }}
                  >
                    Clear AI Match
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-0">
                  <Skeleton className="h-48 rounded-t-lg" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : doctors.length > 0 ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doctor) => (
                <Card
                  key={doctor.user_id}
                  className="overflow-hidden border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/doctors/${doctor.user_id}`)}
                  data-testid={`doctor-card-${doctor.user_id}`}
                >
                  <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                    {doctor.profile_image ? (
                      <img
                        src={doctor.profile_image}
                        alt={doctor.full_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                        <span className="text-4xl font-bold text-primary/50">
                          {doctor.full_name?.charAt(0) || 'D'}
                        </span>
                      </div>
                    )}
                    {doctor.is_verified && (
                      <Badge className="absolute top-3 right-3 bg-green-500">Verified</Badge>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <h3 className="font-semibold text-white text-lg">{doctor.title} {doctor.full_name}</h3>
                      <p className="text-white/80 text-sm">{doctor.specialties?.[0] || 'General Medicine'}</p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{doctor.rating?.toFixed(1) || '5.0'}</span>
                        <span className="text-muted-foreground text-sm">({doctor.review_count || 0})</span>
                      </div>
                      <span className="font-semibold text-primary">₹{doctor.consultation_fee || 0}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {doctor.consultation_types?.includes('telehealth') && (
                        <Badge variant="secondary" className="gap-1">
                          <Video className="w-3 h-3" /> Telehealth
                        </Badge>
                      )}
                      {doctor.consultation_types?.includes('home_visit') && (
                        <Badge variant="secondary" className="gap-1">
                          <Home className="w-3 h-3" /> Home Visit
                        </Badge>
                      )}
                      {doctor.consultation_types?.includes('in_person') && (
                        <Badge variant="secondary" className="gap-1">
                          <MapPin className="w-3 h-3" /> In-person
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{doctor.years_experience || 0}+ years experience</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={filters.page === 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-muted-foreground">
                  Page {filters.page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={filters.page === totalPages}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No doctors found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
