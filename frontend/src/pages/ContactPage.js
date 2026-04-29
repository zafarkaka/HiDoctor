import React from "react";
import { Navbar, Footer, MobileNav } from "../components/Layout";
import { Mail, Trash2, ArrowLeft, Shield, Zap, Info, ChevronRight, Activity, LifeBuoy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { motion } from "framer-motion";

const ContactPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden scale-[0.95] origin-top pb-24 md:pb-0">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
        
        {/* ELITE SUPPORT HEADER */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-slate-950 rounded-[3.5rem] p-12 md:p-16 border border-white/5 shadow-2xl overflow-hidden mb-12"
        >
          <div className="absolute inset-0 mesh-orange-red opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4 text-center md:text-left">
               <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full">
                  <LifeBuoy className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Nexus Support Infrastructure</span>
               </div>
               <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
                 Care Support.
               </h1>
               <p className="text-slate-400 text-lg font-bold italic border-l-2 border-orange-500/30 pl-5">
                 "Orchestrating clinical data privacy and ecosystem assistance."
               </p>
            </div>
            <Button variant="ghost" onClick={() => navigate('/')} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 flex items-center justify-center active:scale-95 transition-all shadow-xl">
               <ArrowLeft className="w-8 h-8" />
            </Button>
          </div>
        </motion.section>

        <div className="grid lg:grid-cols-[1fr,350px] gap-12 items-start">
           
           <div className="space-y-12">
              <Card className="bg-white border-slate-100 rounded-[3.5rem] p-10 md:p-16 shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-bl-full opacity-50 -z-10" />
                 
                 <div className="space-y-10">
                    <div className="flex items-center gap-6">
                       <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center text-white shadow-2xl"><Shield className="w-8 h-8" /></div>
                       <div>
                          <h2 className="text-3xl font-black text-slate-950 tracking-tighter">Data Privacy Protocol</h2>
                          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest italic">"GDPR compliant account termination and data purge."</p>
                       </div>
                    </div>

                    <p className="text-xl text-slate-500 font-bold leading-relaxed italic border-l-4 border-orange-500/20 pl-8">
                       "We maintain the highest clinical standards for your data security. If you wish to terminate your Nexus identity or purge clinical logs, follow our secure protocol below."
                    </p>

                    <div className="space-y-6">
                       {[
                         { step: 1, title: 'Identity Synchronization', desc: 'Transmit a secure request from your registered clinical email handle.' },
                         { step: 2, title: 'Parameter Verification', desc: 'Include your full legal designation and registered Nexus ID (Phone).' },
                         { step: 3, title: 'Purge Cycle', desc: 'Our clinical team will verify and finalize the data purge within 48-72 temporal cycles.' }
                       ].map((protocol) => (
                         <div key={protocol.step} className="flex gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:border-orange-200 transition-all">
                            <div className="w-12 h-12 bg-slate-950 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-xl group-hover:rotate-12 transition-transform">0{protocol.step}</div>
                            <div className="space-y-1">
                               <p className="font-black text-slate-950 tracking-tight text-lg uppercase tracking-widest">{protocol.title}</p>
                               <p className="text-sm text-slate-400 font-bold italic leading-relaxed">"{protocol.desc}"</p>
                            </div>
                         </div>
                       ))}
                    </div>

                    <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row items-center gap-8">
                       <a href="mailto:support@hidoctor.app" className="w-full md:w-auto">
                          <Button className="w-full md:w-auto h-20 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] px-12 font-black uppercase text-xs tracking-[0.3em] shadow-2xl active:scale-95 transition-all shimmer-btn flex items-center gap-4">
                             <Mail className="w-5 h-5" /> Initiate Purge Protocol
                          </Button>
                       </a>
                       <div className="text-center md:text-left space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Secure Communication Channel</p>
                          <p className="text-lg font-black text-slate-950 tracking-tight">support@hidoctor.app</p>
                       </div>
                    </div>
                 </div>
              </Card>
           </div>

           <aside className="space-y-12 sticky top-24">
              <Card className="bg-slate-950 border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                 <div className="absolute inset-0 mesh-orange-red opacity-10 group-hover:opacity-20 transition-opacity" />
                 <div className="relative z-10 space-y-10">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl"><Zap className="w-8 h-8 text-orange-500" /></div>
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-white tracking-tight leading-none">Instant Assistance</h3>
                       <p className="text-slate-500 font-bold text-[10px] italic leading-relaxed">"Average response latency: 1.2 temporal cycles."</p>
                    </div>
                    <p className="text-xs text-slate-400 font-bold italic leading-relaxed">
                       "Our clinical elite support team is globally distributed to ensure 24/7 ecosystem stability and subject assistance."
                    </p>
                    <div className="h-[1px] bg-white/10 w-full" />
                    <div className="flex items-center gap-4">
                       <Activity className="w-5 h-5 text-green-500" />
                       <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Support Grid Active</span>
                    </div>
                 </div>
              </Card>

              <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 flex flex-col items-center text-center gap-6">
                 <Info className="w-8 h-8 text-orange-600" />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                    Identity management governed by <br /> HD SECURE PROTOCOLS 4.0
                 </p>
              </div>
           </aside>

        </div>
      </main>

      <MobileNav />
      <Footer />
    </div>
  );
};

export default ContactPage;
