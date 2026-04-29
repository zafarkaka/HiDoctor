import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Stethoscope, Loader2, ArrowLeft, Mail, KeyRound, CheckCircle, Shield, Zap, ChevronRight, Activity, Lock } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { auth } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1=phone, 2=otp+newPassword, 3=success
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [otp, setOtp] = useState('');
    const [verificationId, setVerificationId] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verifyingOtp, setVerifyingOtp] = useState(false);

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

    const handleRequestCode = async (e) => {
        e.preventDefault();
        if (!phone) { toast.error('Clinical ID (phone) required.'); return; }

        setLoading(true);
        try {
            const fullPhone = countryCode + phone.replace(/\D/g, '');
            await axios.post(`${API_URL}/api/auth/forgot-password`, { phone: fullPhone });
            
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
            }

            const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
            setVerificationId(confirmationResult);
            
            toast.success('Recovery code transmitted to clinical ID.');
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Recovery protocol failed. Verify clinical ID.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!otp || !newPassword) { toast.error('Parameters missing for key synthesis.'); return; }
        if (newPassword.length < 6) { toast.error('Key must be at least 6 clinical characters.'); return; }
        if (newPassword !== confirmPassword) { toast.error('Key mismatch. Synthesis aborted.'); return; }

        setVerifyingOtp(true);
        try {
            const result = await verificationId.confirm(otp);
            const firebaseToken = await result.user.getIdToken();

            const fullPhone = countryCode + phone.replace(/\D/g, '');
            await axios.post(`${API_URL}/api/auth/reset-password`, {
                phone: fullPhone,
                firebase_token: firebaseToken,
                new_password: newPassword,
            });
            setStep(3);
            toast.success('Clinical key synthesized successfully.');
        } catch (error) {
            console.error('Reset Failure:', error);
            toast.error(error.response?.data?.detail || 'Invalid recovery code.');
        } finally {
            setVerifyingOtp(false);
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
                <Button variant="ghost" onClick={() => navigate('/login')} className="gap-3 bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl px-6 py-6 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95">
                    <ArrowLeft className="w-4 h-4" /> Nexus Access
                </Button>
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg relative z-10">
                <Card className="border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[4rem] overflow-hidden bg-white/80 backdrop-blur-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full opacity-50" />
                    
                    <CardHeader className="text-center space-y-8 pt-16 pb-10">
                        <div className="mx-auto w-20 h-20 rounded-[2.5rem] bg-slate-950 flex items-center justify-center shadow-2xl relative">
                            {step === 3 ? <CheckCircle className="w-10 h-10 text-green-500" /> : <Lock className="w-10 h-10 text-white" />}
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-600 rounded-2xl border-4 border-white flex items-center justify-center"><Zap className="w-5 h-5 text-white" /></div>
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-4xl font-black text-slate-950 tracking-tighter">
                                {step === 3 ? 'Key Restored' : step === 2 ? 'Verify & Synth' : 'Key Recovery'}
                            </CardTitle>
                            <CardDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest italic leading-relaxed">
                                {step === 3
                                    ? 'Clinical key synchronized successfully.'
                                    : step === 2
                                        ? 'Enter the 6-digit recovery code sent to your ID.'
                                        : 'Enter your clinical ID to recover access.'}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="px-10 pb-16">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.form key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleRequestCode} className="space-y-8">
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
                                            <Input type="tel" placeholder="999 999 9999" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} className="flex-1 h-16 rounded-2xl border-slate-100 bg-slate-50 font-black text-sm px-8 focus:ring-4 focus:ring-orange-500/10 transition-all" />
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={loading} className="w-full h-20 bg-slate-950 hover:bg-orange-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl active:scale-95 transition-all shimmer-btn group">
                                        {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-4">Transmit Recovery Code <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></span>}
                                    </Button>
                                </motion.form>
                            )}

                            {step === 2 && (
                                <motion.form key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleResetPassword} className="space-y-8">
                                    <div className="space-y-4 p-8 bg-orange-50 rounded-[2.5rem] border border-orange-100">
                                        <Label className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] ml-2">Recovery Code (OTP)</Label>
                                        <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} placeholder="XXXXXX" className="h-20 rounded-2xl border-orange-200 bg-white font-black text-2xl text-center tracking-[0.5em] focus:ring-4 focus:ring-orange-500/10" />
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">New Clinical Key</Label>
                                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-16 rounded-2xl border-slate-100 bg-slate-50 font-black text-sm px-8" />
                                    </div>
                                    <div className="space-y-4">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Re-verify Key</Label>
                                        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-16 rounded-2xl border-slate-100 bg-slate-50 font-black text-sm px-8" />
                                    </div>
                                    <Button type="submit" disabled={verifyingOtp} className="w-full h-20 bg-slate-950 hover:bg-orange-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl active:scale-95 transition-all shimmer-btn group">
                                        {verifyingOtp ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-4">Finalize Synthesis <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></span>}
                                    </Button>
                                    <Button type="button" variant="ghost" className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest" onClick={() => setStep(1)}>Resend Protocol Code</Button>
                                </motion.form>
                            )}

                            {step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8">
                                    <div className="p-8 bg-green-50 rounded-[2.5rem] border border-green-100">
                                       <p className="text-green-700 font-bold text-sm italic">"Your clinical access has been restored. You may now synchronize with your new key."</p>
                                    </div>
                                    <Button className="w-full h-20 bg-slate-950 hover:bg-orange-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl active:scale-95" onClick={() => navigate('/login')}>
                                        Access Nexus Sign-In
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-12 text-center border-t border-slate-100 pt-10">
                            <p className="text-slate-400 font-bold text-xs italic">
                                "Remember Clinical Key?"{' '}
                                <Link to="/login" className="text-orange-600 hover:underline ml-2 uppercase font-black tracking-widest text-[10px]">
                                    Sign In Nexus
                                </Link>
                            </p>
                        </div>
                        <div id="recaptcha-container" className="mt-4 flex justify-center"></div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
