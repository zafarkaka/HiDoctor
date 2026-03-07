import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_URL = process.env.REACT_APP_BACKEND_URL;
import { Link, useNavigate } from 'react-router-dom';
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
  CheckCircle2
} from 'lucide-react';

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


const stats = [
  { value: '35+', label: 'Medical Specialties' },
  { value: '500+', label: 'Verified Doctors' },
  { value: '50K+', label: 'Appointments Booked' },
  { value: '4.9', label: 'Average Rating', icon: Star },
];

// Removed static doctors

export default function LandingPage() {
  const navigate = useNavigate();
  const [ads, setAds] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

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

  const handleAdClick = async (ad) => {
    try {
      await axios.post(`${API_URL}/api/campaigns/${ad.id}/click`);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
    if (ad.redirect_url) window.open(ad.redirect_url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-400/10 rounded-full blur-[120px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-400/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      <div className="absolute top-[40%] right-[-5%] w-[30%] h-[30%] bg-rose-400/5 rounded-full blur-[100px] animate-blob animation-delay-4000" />

      <Navbar />

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative pt-24 pb-20 md:pt-36 md:pb-28 hero-mesh">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Slogan Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <Badge variant="secondary" className="px-5 py-2 text-sm bg-orange-500/10 text-orange-600 border-orange-200/50 rounded-full backdrop-blur-md">
                ✨ Your Health, Our Priority — Anytime, Anywhere
              </Badge>
            </motion.div>

            {/* Large Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.95]"
            >
              <span className="text-slate-900">Hi</span>
              <span className="text-gradient">Doctor</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-2xl md:text-3xl font-semibold text-slate-700 tracking-tight"
            >
              Healthcare, Simplified.
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.6 }}
              className="text-lg sm:text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-light"
            >
              HiDoctor connects you with <strong className="text-slate-700 font-medium">500+ verified specialists</strong> across
              {' '}<strong className="text-slate-700 font-medium">35+ medical fields</strong>. Book in-person or video consultations
              in seconds, manage your family's health, and get expert care — all from one platform.
            </motion.p>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex flex-wrap items-center justify-center gap-5 text-sm text-slate-500"
            >
              <span className="flex items-center gap-1.5 bg-white/60 px-4 py-2 rounded-full border border-slate-200/50 backdrop-blur-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Verified Doctors
              </span>
              <span className="flex items-center gap-1.5 bg-white/60 px-4 py-2 rounded-full border border-slate-200/50 backdrop-blur-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Secure & HIPAA Compliant
              </span>
              <span className="flex items-center gap-1.5 bg-white/60 px-4 py-2 rounded-full border border-slate-200/50 backdrop-blur-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> 24/7 Telehealth
              </span>
              <span className="flex items-center gap-1.5 bg-white/60 px-4 py-2 rounded-full border border-slate-200/50 backdrop-blur-sm">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> 4.9 Patient Rating
              </span>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.5 }}
              className="flex flex-wrap gap-4 justify-center pt-2"
            >
              <Button
                size="xl"
                onClick={() => navigate('/doctors')}
                className="bg-orange-600 text-white hover:bg-orange-700 rounded-full px-12 h-14 shadow-2xl shadow-orange-500/25 btn-premium group text-base"
              >
                Find a Doctor
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              <Button
                size="xl"
                variant="outline"
                onClick={() => navigate('/register')}
                className="rounded-full px-12 h-14 border-orange-200 text-orange-700 hover:bg-orange-50 transition-all font-semibold text-base"
              >
                Create Free Account
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ==================== TRUST STATS BAR ==================== */}
      <section className="py-8 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {stat.icon && <stat.icon className="w-6 h-6 fill-amber-400 text-amber-400" />}
                  <span className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</span>
                </div>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== ADS SECTION ==================== */}
      {ads.length > 0 && (
        <section className="py-10 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              {ads.map((ad, idx) => (
                <Card key={idx} className="overflow-hidden cursor-pointer hover:shadow-lg transition-all rounded-2xl border-slate-100" onClick={() => handleAdClick(ad)}>
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="w-full md:w-2/5 h-48 md:h-auto">
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                    </div>
                    <CardContent className="p-5 flex flex-col justify-center flex-1">
                      <Badge className="w-fit mb-2 bg-primary/10 text-primary border-none text-[10px] uppercase tracking-wider">Sponsored</Badge>
                      <h3 className="text-lg font-bold mb-1 line-clamp-2">{ad.title}</h3>
                      <p className="text-primary font-semibold text-xs flex items-center mt-auto">
                        Learn more <ArrowRight className="w-3 h-3 ml-1" />
                      </p>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ==================== SPECIALTIES ==================== */}
      <section className="py-20 md:py-28 bg-slate-50/70 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm bg-orange-500/10 text-orange-600 border-orange-200/50 rounded-full mb-4">
              Our Specialties
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 tracking-tight">Expertise in Every Field</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-light">
              Connect with specialized doctors across over 35 categories, ensuring you get the specific care you deserve.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {specialties.slice(0, 12).map((specialty, index) => (
              <motion.div
                key={specialty.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Card
                  className="card-hover border-slate-100 group cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/doctors?specialty=${specialty.name}`)}
                  data-testid={`specialty-${specialty.name.toLowerCase()}`}
                >
                  <CardContent className="p-6 text-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400/0 to-orange-400/5 group-hover:from-orange-400/5 transition-all" />
                    <div className={`w-16 h-16 rounded-2xl ${specialty.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-current/10`}>
                      <specialty.icon className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-slate-700 tracking-tight">{specialty.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="outline" onClick={() => navigate('/doctors')} className="rounded-full px-8 h-12 border-orange-200 text-orange-700 hover:bg-orange-50 font-semibold group">
              View All 35+ Specialties <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* ==================== FEATURED DOCTORS ==================== */}
      <section className="py-20 md:py-28 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <Badge variant="secondary" className="px-4 py-1.5 text-sm bg-orange-500/10 text-orange-600 border-orange-200/50 rounded-full mb-4">
                Top Professionals
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-2 text-slate-900 tracking-tight">Top Rated Doctors</h2>
              <p className="text-lg text-slate-500 font-light">Meet our most trusted and highest-rated healthcare professionals</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/doctors')} className="hidden md:flex rounded-full px-6 border-orange-200 text-orange-700 hover:bg-orange-50">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {loadingDoctors ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
              ))
            ) : topDoctors.length > 0 ? (
              topDoctors.map((doctor, index) => (
                <motion.div
                  key={doctor.user_id || doctor.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-500 border-border/50 cursor-pointer group rounded-2xl" onClick={() => navigate(`/doctors/${doctor.user_id || doctor.id}`)}>
                    <div className="aspect-[4/3] relative overflow-hidden">
                      {/* Dynamic image resolution: handles already absolute URLs, relative uploads, and fallbacks */}
                      <img
                        src={
                          !doctor.profile_image
                            ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop'
                            : (doctor.profile_image.startsWith('http')
                              ? doctor.profile_image
                              : `${API_URL}${doctor.profile_image.startsWith('/') ? '' : '/'}${doctor.profile_image}`)
                        }
                        alt={doctor.full_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="font-semibold text-lg">{doctor.full_name}</h3>
                        <p className="text-white/80 text-sm">{doctor.specialties?.join(', ') || 'Specialist'}</p>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-slate-800">{doctor.rating || 5.0}</span>
                          <span className="text-muted-foreground text-sm">({doctor.review_count || 0} reviews)</span>
                        </div>
                        <Button size="sm" className="rounded-full px-5">
                          Book Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-slate-500">
                No doctors rated yet.
              </div>
            )}
          </div>

          <div className="mt-10 text-center md:hidden">
            <Button variant="outline" onClick={() => navigate('/doctors')} className="rounded-full px-8">
              View All Doctors
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>



      {/* ==================== DOWNLOAD APP ==================== */}
      <section className="py-16 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="glass-premium overflow-hidden border-0 bg-gradient-premium text-white rounded-[2rem]">
            <CardContent className="p-10 md:p-16">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div className="space-y-6">
                  <h3 className="text-3xl md:text-4xl font-bold">Experience HiDoctor on Mobile</h3>
                  <p className="text-lg text-white/90 font-light leading-relaxed">
                    Take your health on the go. Our Android app gives you instant access to appointments, video calls, health records, and more — right from your pocket.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <a
                      href="/download/hidoctor.apk"
                      className="inline-flex items-center justify-center rounded-full bg-white px-10 py-4 text-lg font-bold text-orange-600 hover:bg-orange-50 shadow-2xl transition-all gap-3 hover:scale-105 active:scale-95"
                      download
                    >
                      <Download className="w-6 h-6" />
                      Download APK
                    </a>
                  </div>
                  <div className="flex items-center gap-2 opacity-80">
                    <Smartphone className="w-5 h-5" />
                    <span className="text-sm font-medium tracking-wide">Version 1.0.0 · Android</span>
                  </div>
                </div>
                <div className="hidden md:flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-8 bg-white/10 rounded-[2rem] blur-2xl" />
                    <div className="relative bg-white/10 rounded-[2rem] p-8 backdrop-blur-sm border border-white/20">
                      <div className="space-y-4 text-center">
                        <Smartphone className="w-16 h-16 mx-auto text-white/80" />
                        <h4 className="text-2xl font-bold">HiDoctor App</h4>
                        <div className="flex items-center justify-center gap-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className="w-5 h-5 fill-amber-300 text-amber-300" />
                          ))}
                        </div>
                        <p className="text-white/70 text-sm">Rated 4.9 by our users</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-0 bg-primary rounded-[2rem]">
            <CardContent className="p-10 md:p-16">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div className="text-white space-y-6">
                  <h2 className="text-3xl md:text-5xl font-bold leading-tight">Ready to take control of your health?</h2>
                  <p className="text-white/80 text-lg font-light leading-relaxed">
                    Join thousands of patients who trust HiDoctor for seamless, secure, and professional healthcare. Create your free account today and book your first appointment in under 60 seconds.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => navigate('/register')}
                      className="rounded-full px-8 h-14 text-base"
                      data-testid="cta-signup-btn"
                    >
                      Create Free Account
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => navigate('/doctors')}
                      className="rounded-full px-8 h-14 border-white/30 text-white hover:bg-white/10 text-base"
                    >
                      Explore Doctors
                    </Button>
                  </div>
                </div>
                <div className="hidden md:flex justify-end">
                  <div className="relative">
                    <div className="absolute inset-0 bg-white/10 rounded-2xl blur-xl" />
                    <img
                      src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=500&h=400&fit=crop"
                      alt="Healthcare professional"
                      className="relative rounded-2xl shadow-2xl"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
