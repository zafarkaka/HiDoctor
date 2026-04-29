import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, MobileNav, Footer } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Plus,
  Trash2,
  User,
  Calendar as CalendarIcon,
  Users,
  AlertCircle,
  Loader2,
  Shield,
  Activity,
  Heart,
  ChevronRight,
  UserPlus
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

export default function FamilyMembers() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    gender: '',
    relationship: '',
    allergies: '',
    chronic_conditions: '',
    insurance_provider: '',
    insurance_id: ''
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/family-members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data.members || []);
    } catch (error) {
      console.error('Error fetching clinical network:', error);
      toast.error('Failed to load clinical network.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || !formData.date_of_birth || !formData.gender || !formData.relationship) {
      toast.error('Required clinical parameters missing.');
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        ...formData,
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
        chronic_conditions: formData.chronic_conditions ? formData.chronic_conditions.split(',').map(s => s.trim()) : []
      };

      await axios.post(`${API_URL}/api/family-members`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('New subject added to clinical network.');
      setDialogOpen(false);
      setFormData({
        full_name: '',
        date_of_birth: '',
        gender: '',
        relationship: '',
        allergies: '',
        chronic_conditions: '',
        insurance_provider: '',
        insurance_id: ''
      });
      fetchMembers();
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error(error.response?.data?.detail || 'Subject integration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('Initialize subject removal protocol?')) return;

    try {
      await axios.delete(`${API_URL}/api/family-members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Subject removed from network.');
      fetchMembers();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to remove subject.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden scale-[0.95] origin-top pb-24 md:pb-0">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
        
        {/* ELITE NETWORK HEADER */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-slate-950 rounded-[3.5rem] p-12 md:p-16 border border-white/5 shadow-2xl overflow-hidden mb-12"
        >
          <div className="absolute inset-0 mesh-orange-red opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4 text-center md:text-left">
               <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full">
                  <Users className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Clinical Network Hub</span>
               </div>
               <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
                 My Care Network.
               </h1>
               <p className="text-slate-400 text-lg font-bold italic border-l-2 border-orange-500/30 pl-5">
                 "Manage clinical subjects for multi-encounter synchronization."
               </p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={members.length >= 4}
                  className="bg-white hover:bg-orange-50 text-slate-950 rounded-2xl px-10 py-8 font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all gap-3"
                >
                  <UserPlus className="w-5 h-5" /> Integrate Subject
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-[3rem] p-10 bg-white border-none shadow-2xl">
                <DialogHeader className="mb-8">
                  <DialogTitle className="text-3xl font-black text-slate-950 tracking-tighter">Subject Integration Protocol</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Full Name *</Label>
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6 focus:ring-4 focus:ring-orange-500/10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase Initiation (DOB) *</Label>
                      <Input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Biological Gender *</Label>
                      <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold">
                          <SelectValue placeholder="Select Parameter" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl font-bold">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Non-Binary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Relationship *</Label>
                      <Select value={formData.relationship} onValueChange={(v) => setFormData({ ...formData, relationship: v })}>
                        <SelectTrigger className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold">
                          <SelectValue placeholder="Select Connection" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl font-bold">
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="child">Child</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Immunological Allergies</Label>
                       <Input
                         value={formData.allergies}
                         onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                         placeholder="e.g. Penicillin, Peanuts (Comma separated)"
                         className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chronic Status Log</Label>
                       <Input
                         value={formData.chronic_conditions}
                         onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                         placeholder="e.g. Diabetes, Asthma (Comma separated)"
                         className="h-14 rounded-xl border-slate-100 bg-slate-50 font-bold px-6"
                       />
                    </div>
                  </div>

                  <DialogFooter className="pt-6 border-t border-slate-100">
                    <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl font-black text-xs uppercase tracking-widest text-slate-400">Cancel Protocol</Button>
                    <Button type="submit" disabled={submitting} className="bg-slate-950 text-white rounded-xl px-10 py-4 font-black text-xs uppercase tracking-widest shadow-xl active:scale-95">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finalize Integration'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </motion.section>

        {/* NETWORK STATUS MATRIX */}
        <div className="grid md:grid-cols-[350px,1fr] gap-12">
           
           <aside className="space-y-8">
              <Card className="bg-white border-slate-100 rounded-[2.5rem] p-10 shadow-xl space-y-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full opacity-50" />
                 <div className="relative z-10 space-y-4 text-center">
                    <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto shadow-xl"><Shield className="w-8 h-8 text-white" /></div>
                    <h3 className="text-2xl font-black text-slate-950 tracking-tighter">Network Capacity</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-relaxed italic">"Secure subjects synchronized for rapid clinical access."</p>
                    <div className="pt-6">
                       <p className="text-6xl font-black text-orange-600 tracking-tighter leading-none">{members.length}<span className="text-slate-200">/4</span></p>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Slots Occupied</p>
                    </div>
                 </div>
              </Card>

              <Card className="bg-slate-950 border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 mesh-orange-red opacity-10 group-hover:opacity-20 transition-opacity" />
                 <div className="relative z-10 space-y-6">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10"><Activity className="w-6 h-6 text-orange-500" /></div>
                    <div className="space-y-1">
                       <h4 className="text-lg font-black text-white tracking-tight">Rapid Deployment</h4>
                       <p className="text-slate-500 font-bold text-[10px] italic">"Integrated subjects can be selected instantly during clinical booking cycles."</p>
                    </div>
                 </div>
              </Card>
           </aside>

           <div className="space-y-8">
              <div className="flex items-center justify-between">
                 <h2 className="text-3xl font-black text-slate-950 tracking-tight">Active Subjects</h2>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Network Synchronization: Secure</p>
              </div>

              {loading ? (
                [1, 2].map(i => <Skeleton key={i} className="h-48 rounded-[3rem] bg-slate-50" />)
              ) : members.length > 0 ? (
                <div className="grid gap-8">
                  {members.map((member, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={member.id}
                      className="group bg-white rounded-[3rem] border border-slate-100 p-10 flex flex-col md:flex-row items-center gap-10 hover:shadow-2xl hover:border-orange-100 transition-all relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-40 h-40 bg-slate-50 rounded-bl-[5rem] group-hover:bg-orange-50 transition-colors" />
                      
                      <div className="w-24 h-24 rounded-3xl bg-slate-950 flex items-center justify-center text-white shadow-2xl relative z-10">
                         <User className="w-10 h-10" />
                         <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-orange-600 rounded-xl border-4 border-white flex items-center justify-center font-black text-xs">#{idx+1}</div>
                      </div>

                      <div className="flex-1 space-y-6 relative z-10">
                         <div className="space-y-1">
                            <div className="flex items-center gap-4">
                               <h3 className="text-3xl font-black text-slate-950 tracking-tighter">{member.full_name}</h3>
                               <Badge className="bg-orange-500/10 text-orange-600 border border-orange-200 px-4 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">{member.relationship}</Badge>
                            </div>
                            <div className="flex gap-4 text-slate-400 font-bold text-xs">
                               <span className="flex items-center gap-2"><CalendarIcon className="w-3 h-3" /> DOB: {formatDate(member.date_of_birth)}</span>
                               <span className="flex items-center gap-2"><Heart className="w-3 h-3" /> Gender: {member.gender.toUpperCase()}</span>
                            </div>
                         </div>

                         <div className="flex flex-wrap gap-3">
                            {member.allergies?.map((a, i) => (
                              <Badge key={i} className="bg-red-600 text-white font-black text-[8px] uppercase tracking-widest px-3 py-1.5 rounded-lg border-none shadow-sm">{a}</Badge>
                            ))}
                            {member.chronic_conditions?.map((c, i) => (
                              <Badge key={i} className="bg-amber-500 text-white font-black text-[8px] uppercase tracking-widest px-3 py-1.5 rounded-lg border-none shadow-sm">{c}</Badge>
                            ))}
                            {!member.allergies?.length && !member.chronic_conditions?.length && (
                              <p className="text-[10px] font-bold text-slate-300 italic">"No clinical conditions logged."</p>
                            )}
                         </div>
                      </div>

                      <div className="flex flex-col gap-4 relative z-10">
                         <Button onClick={() => handleDelete(member.id)} variant="ghost" size="icon" className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-300 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                            <Trash2 className="w-6 h-6" />
                         </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 bg-slate-50 rounded-[3.5rem] border border-slate-100 space-y-8">
                   <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl"><Users className="w-12 h-12 text-slate-200" /></div>
                   <div className="space-y-3">
                      <h3 className="text-3xl font-black text-slate-950 tracking-tight">Network Empty</h3>
                      <p className="text-slate-400 font-bold text-sm italic max-w-sm mx-auto">"Initiate subject integration to enable rapid clinical booking for your family network."</p>
                   </div>
                   <Button onClick={() => setDialogOpen(true)} className="bg-slate-950 text-white rounded-2xl px-12 py-6 font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95">Integrate First Subject</Button>
                </div>
              )}
           </div>
        </div>
      </main>

      <MobileNav />
      <Footer />
    </div>
  );
}
