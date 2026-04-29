import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Stethoscope, Loader2, ArrowLeft, User, UserCog, Camera, Upload, X, Shield, Zap, ChevronRight, Activity, Lock } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { auth } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient'
  });
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch (e) { console.warn('Verifier cleanup error:', e); }
      window.recaptchaVerifier = null;
    }

    const initVerifier = () => {
      const container = document.getElementById('recaptcha-container');
      if (container && !window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => { console.log('Nexus ReCAPTCHA verified'); }
          });
        } catch (e) { console.error('ReCAPTCHA initialization failure:', e); }
      }
    };

    initVerifier();
    return () => {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (e) { console.warn('Unmount cleanup failure:', e); }
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendOtp = async () => {
    if (!formData.phone) {
      toast.error('Clinical ID (phone) required.');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = countryCode + formData.phone.replace(/\D/g, '');
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
      }

      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setVerificationId(confirmationResult);
      setShowOtpInput(true);
      toast.success('Access code transmitted to clinical ID.');
    } catch (err) {
      console.error('OTP Transmission Error:', err);
      toast.error('Transmission failure. Verify clinical ID format.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSubmit = async (e) => {
    e.preventDefault();
    if (!verificationId) return;
    if (otp.length !== 6) { toast.error('6-digit access code required.'); return; }
    if (formData.password !== formData.confirmPassword) { toast.error('Key mismatch. Verify passwords.'); return; }

    setVerifyingOtp(true);
    try {
      const result = await verificationId.confirm(otp);
      const firebaseToken = await result.user.getIdToken();
      await handleFinalSubmit(firebaseToken);
    } catch (err) {
      console.error('Verification Failure:', err);
      toast.error('Invalid access code. Verification aborted.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleFinalSubmit = async (firebaseToken) => {
    setLoading(true);
    try {
      const fullPhone = countryCode + formData.phone.replace(/\D/g, '');
      const user = await register({
        full_name: formData.full_name,
        username: formData.username,
        phone: fullPhone,
        password: formData.password,
        role: formData.role,
        firebase_token: firebaseToken
      });

      if (formData.role === 'doctor' && profilePic) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', profilePic);
        const token = localStorage.getItem('token');
        await axios.post(`${API_URL}/api/auth/profile/picture`, uploadFormData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      toast.success('Clinical identity synthesized. Welcome to the Nexus.');
      if (user.role === 'doctor') navigate('/doctor/onboarding');
      else navigate('/patient');
    } catch (err) {
      console.error('Synthesis Error:', err);
      toast.error('Registration protocol failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden flex items-center justify-center relative px-4 py-20">
      
      {/* IMMERSIVE BACKGROUND */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/5 blur-[120px] rounded-full" />
         <div className="absolute inset-0 mesh-orange-red opacity-5" />
      </div>

      {/* HEADER NAV */}
      <div className="absolute top-10 left-10 z-20">
         <Button variant="ghost" onClick={() => navigate('/')} className="gap-3 bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl px-6 py-6 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95">
           <ArrowLeft className="w-4 h-4" /> Nexus Hub
         </Button>
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl relative z-10">
        <Card className="border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[4rem] overflow-hidden bg-white/80 backdrop-blur-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-bl-full opacity-50" />
          
          <CardHeader className="text-center space-y-8 pt-16 pb-10">
            <div className="mx-auto w-20 h-20 rounded-[2.5rem] bg-slate-950 flex items-center justify-center shadow-2xl relative">
              <UserPlus className="w-10 h-10 text-white" />
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-600 rounded-2xl border-4 border-white flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-4xl font-black text-slate-950 tracking-tighter">Entity Initiation</CardTitle>
              <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest italic leading-relaxed">"Join the Clinical Elite network infrastructure."</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-10 pb-16">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-10">
              
              {/* Role Selection Matrix */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Clinical Designation</Label>
                <RadioGroup value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })} className="grid grid-cols-2 gap-6">
                  {[
                    { id: 'patient', label: 'Clinical Subject', icon: User, desc: 'Receive Elite Care' },
                    { id: 'doctor', label: 'Lead Specialist', icon: UserCog, desc: 'Provide Clinical Synthesis' }
                  ].map((role) => (
                    <Label key={role.id} htmlFor={role.id} className={`flex flex-col items-center gap-4 p-8 rounded-[2.5rem] border-2 cursor-pointer transition-all shadow-sm relative overflow-hidden ${formData.role === role.id ? 'border-orange-600 bg-orange-50/50 scale-105 shadow-xl' : 'border-slate-100 bg-white hover:border-orange-200'}`}>
                       <role.icon className={`w-10 h-10 ${formData.role === role.id ? 'text-orange-600' : 'text-slate-300'}`} />
                       <div className="text-center">
                          <span className={`block font-black text-xs uppercase tracking-widest ${formData.role === role.id ? 'text-slate-950' : 'text-slate-400'}`}>{role.label}</span>
                          <span className="text-[9px] font-bold text-slate-400 italic">{role.desc}</span>
                       </div>
                       <RadioGroupItem value={role.id} id={role.id} className="sr-only" />
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Specialist Profile Photo for Doctors */}
              <AnimatePresence>
                {formData.role === 'doctor' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 overflow-hidden">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2 flex items-center gap-2"><Camera className="w-3 h-3" /> Identity Synthesis (Photo)</Label>
                    <div className="p-8 bg-slate-950 rounded-[2.5rem] flex items-center gap-8 border border-white/5 shadow-2xl relative overflow-hidden">
                       <div className="absolute inset-0 mesh-orange-red opacity-10" />
                       <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center relative z-10">
                          {previewUrl ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" /> : <Upload className="w-8 h-8 text-white/20" />}
                       </div>
                       <div className="flex-1 space-y-3 relative z-10">
                          <p className="text-white font-black text-xs uppercase tracking-widest">Specialist Avatar Required</p>
                          <input type="file" id="doctor-pfp" className="hidden" accept="image/*" onChange={(e) => {
                             const f = e.target.files[0];
                             if (f) { setProfilePic(f); setPreviewUrl(URL.createObjectURL(f)); }
                          }} />
                          <Button type="button" onClick={() => document.getElementById('doctor-pfp').click()} className="bg-white text-slate-950 rounded-xl px-6 py-2 font-black text-[9px] uppercase tracking-widest hover:bg-orange-50">Upload Matrix</Button>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Legal Full Designation</Label>
                    <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Nexus Handle (Username)</Label>
                    <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6" />
                 </div>
              </div>

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
                    </SelectContent>
                  </Select>
                  <Input type="tel" placeholder="999 999 9999" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} className="flex-1 h-16 rounded-2xl border-slate-100 bg-slate-50 font-black text-sm px-8 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Access Key</Label>
                    <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Re-verify Key</Label>
                    <Input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6" />
                 </div>
              </div>

              {!showOtpInput ? (
                <Button onClick={handleSendOtp} disabled={loading} className="w-full h-20 bg-slate-950 hover:bg-orange-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl active:scale-95 transition-all shimmer-btn group">
                  {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-4">Initialize Verification <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></span>}
                </Button>
              ) : (
                <div className="space-y-8 p-8 bg-orange-50 rounded-[2.5rem] border border-orange-100">
                   <div className="space-y-4">
                      <Label className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] ml-2">Secure Verification Code (OTP)</Label>
                      <Input value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} placeholder="XXXXXX" className="h-20 rounded-2xl border-orange-200 bg-white font-black text-2xl text-center tracking-[0.5em] focus:ring-4 focus:ring-orange-500/10" />
                   </div>
                   <Button onClick={handleVerifyAndSubmit} disabled={verifyingOtp || loading} className="w-full h-16 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                      {verifyingOtp ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Finalize Initiation Protocol'}
                   </Button>
                </div>
              )}
            </form>
            
            <div id="recaptcha-container" className="mt-4 flex justify-center min-h-[50px]"></div>

            <div className="mt-12 text-center border-t border-slate-100 pt-10">
              <p className="text-slate-400 font-bold text-xs italic">
                "Already Synchronized?"{' '}
                <Link to="/login" className="text-orange-600 hover:underline ml-2 uppercase font-black tracking-widest text-[10px]">
                  Sign In Nexus
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
