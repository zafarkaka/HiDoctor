import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Stethoscope, Loader2, ArrowLeft, Shield, Zap, Lock, ChevronRight, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [countryCode, setCountryCode] = useState('+91');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fullPhone = countryCode + formData.phone.replace(/\D/g, '');
      const user = await login(fullPhone, formData.password);
      toast.success('Clinical identity synchronized. Welcome back.');

      const dashboardRoutes = {
        patient: '/patient',
        doctor: '/doctor',
        admin: '/admin'
      };
      navigate(dashboardRoutes[user.role] || from);
    } catch (err) {
      console.error('Authentication failure:', err);
      const detail = err.response?.data?.detail;
      let errorMessage = 'Protocol error: Authentication failed.';

      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map(e => e.msg).join(', ');
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-hidden flex items-center justify-center relative px-4">
      
      {/* IMMERSIVE BACKGROUND */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-600/10 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/5 blur-[120px] rounded-full" />
         <div className="absolute inset-0 mesh-orange-red opacity-5" />
      </div>

      {/* HEADER NAV */}
      <div className="absolute top-10 left-10 z-20">
         <Button
           variant="ghost"
           onClick={() => navigate('/')}
           className="gap-3 bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl px-6 py-6 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95"
         >
           <ArrowLeft className="w-4 h-4" />
           Back to Nexus
         </Button>
      </div>

      {/* LOGIN MATRIX */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <Card className="border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[4rem] overflow-hidden bg-white/80 backdrop-blur-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full opacity-50" />
          
          <CardHeader className="text-center space-y-8 pt-16 pb-10">
            <div className="mx-auto w-20 h-20 rounded-[2.5rem] bg-slate-950 flex items-center justify-center shadow-2xl relative">
              <Lock className="w-10 h-10 text-white" />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-600 rounded-2xl border-4 border-white flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-4xl font-black text-slate-950 tracking-tighter">Identity Access</CardTitle>
              <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest italic leading-relaxed">"Synchronize with the Clinical Elite ecosystem."</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-10 pb-16">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Clinical Secure ID (Phone)</Label>
                <div className="flex gap-3">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="h-16 w-[120px] rounded-2xl border-slate-100 bg-slate-50 font-black text-sm">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl font-bold">
                      <SelectItem value="+91">🇮🇳 +91</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      <SelectItem value="+61">🇦🇺 +61</SelectItem>
                      <SelectItem value="+971">🇦🇪 +971</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    placeholder="999 999 9999"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    required
                    className="flex-1 h-16 rounded-2xl border-slate-100 bg-slate-50 font-black text-sm px-8 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Access Key</Label>
                  <Link to="/forgot-password" title="Forgot Access Key?" className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline">
                    Reset Protocol?
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="Enter secure key..."
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-16 rounded-2xl border-slate-100 bg-slate-50 font-black text-sm px-8 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-20 bg-slate-950 hover:bg-orange-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl active:scale-95 transition-all shimmer-btn group"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  <span className="flex items-center justify-center gap-4">Initialize Session <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></span>
                )}
              </Button>
            </form>

            <div className="mt-12 text-center border-t border-slate-100 pt-10">
              <p className="text-slate-400 font-bold text-xs italic">
                "New Entity?"{' '}
                <Link to="/register" className="text-orange-600 hover:underline ml-2 uppercase font-black tracking-widest text-[10px]">
                  Initiate Registration
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* TRUST WIDGET */}
        <div className="mt-10 flex items-center justify-center gap-10 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
           <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-600" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-950">AES-256 Secured</span>
           </div>
           <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-600" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-950">Clinical Grid 4.0</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
