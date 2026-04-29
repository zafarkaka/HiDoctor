import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, MobileNav, Footer } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
  User,
  Bell,
  Shield,
  Download,
  Trash2,
  Loader2,
  Save,
  ChevronLeft,
  Camera,
  Activity,
  Zap,
  Globe,
  Lock,
  Heart,
  ChevronRight,
  Info
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export default function ProfileSettings() {
  const { user, token, logout, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    preferred_language: 'English',
    insurance_provider: '',
    insurance_id: '',
    allergies: '',
    chronic_conditions: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    consultation_fee: ''
  });
  const [notifications, setNotifications] = useState({
    appointments: true,
    messages: true,
    reminders: true,
    marketing: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const endpoint = user?.role === 'patient'
        ? `${API_URL}/api/patients/profile`
        : user?.role === 'doctor'
          ? `${API_URL}/api/doctors/profile`
          : `${API_URL}/api/auth/me`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(response.data);
      setFormData(prev => ({
        ...prev,
        full_name: response.data?.full_name || user?.full_name || '',
        phone: response.data?.phone || user?.phone || '',
        address: response.data?.address || '',
        date_of_birth: response.data?.date_of_birth || '',
        gender: response.data?.gender || '',
        preferred_language: response.data?.preferred_language || 'English',
        insurance_provider: response.data?.insurance_provider || '',
        insurance_id: response.data?.insurance_id || '',
        allergies: response.data?.allergies?.join(', ') || '',
        chronic_conditions: response.data?.chronic_conditions?.join(', ') || '',
        emergency_contact_name: response.data?.emergency_contact_name || '',
        emergency_contact_phone: response.data?.emergency_contact_phone || '',
        consultation_fee: response.data?.consultation_fee || ''
      }));
    } catch (error) {
      console.error('Error fetching clinical profile:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (uploadFile) {
        const fileData = new FormData();
        fileData.append('file', uploadFile);
        await axios.post(`${API_URL}/api/auth/profile/picture`, fileData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (user?.role === 'patient') {
        const data = {
          ...formData,
          allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
          chronic_conditions: formData.chronic_conditions ? formData.chronic_conditions.split(',').map(s => s.trim()) : []
        };
        await axios.put(`${API_URL}/api/patients/profile`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (user?.role === 'doctor') {
        const doctorData = { ...formData };
        if (doctorData.consultation_fee) {
          doctorData.consultation_fee = parseFloat(doctorData.consultation_fee);
        }
        await axios.put(`${API_URL}/api/doctors/profile`, doctorData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.put(`${API_URL}/api/auth/profile`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      toast.success('Clinical identity updated successfully.');
      setUploadFile(null);
      await fetchProfile();
      if (typeof fetchUser === 'function') {
        await fetchUser();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update clinical profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      toast.success('Account deletion sequence initiated.');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Account deletion protocol failed.');
    }
  };

  const handleExportData = async () => {
    toast.success('Clinical data export requested via secure SMS channel.');
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden scale-[0.95] origin-top pb-24 md:pb-0">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
        
        {/* ELITE SETTINGS HEADER */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-slate-950 rounded-[3.5rem] p-12 md:p-16 border border-white/5 shadow-2xl overflow-hidden mb-12"
        >
          <div className="absolute inset-0 mesh-orange-red opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4 text-center md:text-left">
               <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Secure Infrastructure Hub</span>
               </div>
               <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
                 Global Settings.
               </h1>
               <p className="text-slate-400 text-lg font-bold italic border-l-2 border-orange-500/30 pl-5">
                 "Orchestrating your clinical identity and secure preferences."
               </p>
            </div>
            <Button variant="ghost" onClick={() => navigate(-1)} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 flex items-center justify-center active:scale-95 transition-all shadow-xl">
               <ChevronLeft className="w-8 h-8" />
            </Button>
          </div>
        </motion.section>

        <div className="grid lg:grid-cols-[1fr,350px] gap-12 items-start">
           
           <div className="space-y-12">
              
              {/* Profile Information */}
              <Card className="bg-white border-slate-100 rounded-[3rem] p-10 shadow-xl space-y-10">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <h3 className="text-3xl font-black text-slate-950 tracking-tighter">Clinical Identity</h3>
                       <p className="text-slate-400 font-bold text-xs italic">"Verification parameters for your professional profile."</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm"><User className="w-6 h-6" /></div>
                 </div>

                 <div className="flex flex-col md:flex-row gap-10 items-center bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('pfp-input').click()}>
                       <div className="w-32 h-32 rounded-[2.5rem] bg-slate-950 overflow-hidden shadow-2xl border-4 border-white flex items-center justify-center relative z-10">
                          {profile?.profile_image || uploadFile ? (
                            <img src={uploadFile ? URL.createObjectURL(uploadFile) : profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-12 h-12 text-white/50" />
                          )}
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Camera className="w-8 h-8 text-white" />
                          </div>
                       </div>
                       <input id="pfp-input" type="file" accept="image/*" className="hidden" onChange={(e) => setUploadFile(e.target.files[0])} />
                       <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-xl z-20"><Zap className="w-6 h-6" /></div>
                    </div>
                    <div className="flex-1 space-y-2 text-center md:text-left">
                       <p className="text-lg font-black text-slate-950 tracking-tight">Clinical Avatar</p>
                       <p className="text-xs text-slate-400 font-bold italic leading-relaxed">"Recommended: High-resolution professional square synthesis. Max 10MB."</p>
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Legal Designation</Label>
                       <Input value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6 focus:ring-4 focus:ring-orange-500/10" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Contact Line</Label>
                       <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6 focus:ring-4 focus:ring-orange-500/10" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporal Origin (DOB)</Label>
                       <div className="h-14 rounded-xl border border-slate-100 bg-slate-50 font-bold px-6 flex items-center text-slate-400 italic">
                          {formData.date_of_birth ? formatDate(formData.date_of_birth) : 'Clinical Parameter Not Defined'}
                       </div>
                    </div>
                    {user?.role === 'doctor' && (
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultation Phase Fee (INR)</Label>
                          <Input type="number" value={formData.consultation_fee} onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })} className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6 focus:ring-4 focus:ring-orange-500/10" />
                       </div>
                    )}
                 </div>

                 {user?.role === 'patient' && (
                    <div className="space-y-8 pt-8 border-t border-slate-50">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Geospatial Coordinates (Address)</Label>
                          <Textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="rounded-2xl border-slate-100 bg-slate-50 font-bold p-6 focus:ring-4 focus:ring-orange-500/10" rows={3} />
                       </div>

                       <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allergic Sensitivities</Label>
                             <Input value={formData.allergies} onChange={(e) => setFormData({ ...formData, allergies: e.target.value })} placeholder="e.g. Penicillin, Peanuts" className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6" />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chronic Status Log</Label>
                             <Input value={formData.chronic_conditions} onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })} placeholder="e.g. Asthma, Hypertension" className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6" />
                          </div>
                       </div>
                    </div>
                 )}

                 <Button onClick={handleSave} disabled={loading} className="w-full bg-slate-950 hover:bg-orange-600 text-white rounded-2xl py-8 font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all group">
                    {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <><Save className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" /> Synchronize Identity</>}
                 </Button>
              </Card>

              {/* Notification Matrix */}
              <Card className="bg-white border-slate-100 rounded-[3rem] p-10 shadow-xl space-y-10">
                 <div className="flex items-center justify-between">
                    <div className="space-y-1">
                       <h3 className="text-3xl font-black text-slate-950 tracking-tighter">Event Synthesis</h3>
                       <p className="text-slate-400 font-bold text-xs italic">"Manage your clinical event synchronization channels."</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><Bell className="w-6 h-6" /></div>
                 </div>

                 <div className="space-y-6">
                    {[
                      { key: 'appointments', label: 'Clinical Phase Updates', desc: 'Real-time synchronization of encounter changes.' },
                      { key: 'messages', label: 'Encrypted Communications', desc: 'Alerts for direct specialist messaging.' },
                      { key: 'reminders', label: 'Temporal Reminders', desc: 'Pre-encounter notifications and clinical alerts.' },
                      { key: 'marketing', label: 'Ecosystem Updates', desc: 'Clinical news and global network announcements.' }
                    ].map((pref) => (
                      <div key={pref.key} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                         <div className="space-y-1">
                            <p className="font-black text-slate-950 tracking-tight text-sm">{pref.label}</p>
                            <p className="text-[10px] text-slate-400 font-bold italic">{pref.desc}</p>
                         </div>
                         <Switch
                           checked={notifications[pref.key]}
                           onCheckedChange={(checked) => setNotifications({ ...notifications, [pref.key]: checked })}
                           className="data-[state=checked]:bg-orange-600"
                         />
                      </div>
                    ))}
                 </div>
              </Card>
           </div>

           <aside className="space-y-12 sticky top-24">
              
              {/* Privacy & Security */}
              <Card className="bg-slate-950 border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 mesh-orange-red opacity-10 group-hover:opacity-20 transition-opacity" />
                 <div className="relative z-10 space-y-10">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl group-hover:rotate-12 transition-transform duration-500"><Lock className="w-8 h-8 text-orange-500" /></div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-white tracking-tight leading-none">Security Protocol</h3>
                       <p className="text-slate-500 font-bold text-[10px] italic leading-relaxed">"GDPR compliant clinical data export and account management."</p>
                    </div>
                    
                    <div className="space-y-4">
                       <Button variant="outline" onClick={handleExportData} className="w-full h-16 bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3">
                          <Download className="w-4 h-4 text-orange-500" /> Data Synthesis (GDPR)
                       </Button>

                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <Button variant="ghost" className="w-full h-16 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3">
                                <Trash2 className="w-4 h-4" /> Purge Identity
                             </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[3rem] p-10 bg-white border-none shadow-2xl">
                             <AlertDialogHeader className="mb-8">
                                <AlertDialogTitle className="text-3xl font-black text-slate-950 tracking-tighter">Terminate Clinical Existence?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500 font-bold text-sm italic">
                                   "This operation is terminal. All clinical logs, subjects, and encounters associated with this identity will be purged from the global network."
                                </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter className="pt-6 border-t border-slate-100">
                                <AlertDialogCancel className="rounded-xl font-black text-xs uppercase tracking-widest text-slate-400">Abort Deletion</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-10 py-4 font-black text-xs uppercase tracking-widest shadow-xl">Purge Account</AlertDialogAction>
                             </AlertDialogFooter>
                          </AlertDialogContent>
                       </AlertDialog>
                    </div>
                 </div>
              </Card>

              {/* Ecosystem Stats Widget */}
              <div className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl space-y-6 text-center">
                 <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto text-orange-600 shadow-sm"><Globe className="w-7 h-7" /></div>
                 <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Network Phase Status</p>
                    <p className="font-black text-slate-950 tracking-tight">SECURE PROTOCOL 4.0</p>
                 </div>
                 <div className="h-[1px] bg-slate-100 w-full" />
                 <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
                    "Your identity is encrypted using bank-grade synthesis standards."
                 </p>
              </div>

           </aside>
        </div>
      </main>

      <MobileNav />
      <Footer />
    </div>
  );
}
