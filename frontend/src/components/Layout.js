import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import AIAssistant from './AIAssistant';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import {
  Bell,
  Menu,
  X,
  Home,
  Search,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  Stethoscope,
  LayoutDashboard,
  Smartphone,
  Facebook,
  Instagram,
  Youtube,
  Mail,
  ChevronDown,
  ArrowRight,
  Shield,
  Heart
} from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    const routes = { patient: '/patient', doctor: '/doctor', admin: '/admin' };
    return routes[user.role] || '/';
  };

  const navLinks = [
    { name: 'Elite Search', path: '/doctors' },
    { name: 'Divisions', path: '/#specialties' },
    { name: 'Research Hub', path: '/blog' },
    { name: 'Ecosystem', path: '/#app' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
      isScrolled 
      ? 'py-4 bg-white/80 backdrop-blur-2xl border-b border-orange-100/50 shadow-[0_10px_40px_rgba(239,68,68,0.05)]' 
      : 'py-8 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          
          {/* Logo with Pizzazz */}
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-600 to-red-600 rounded-[1rem] flex items-center justify-center shadow-2xl shadow-orange-600/30 group-hover:rotate-[15deg] transition-all duration-500">
                <Stethoscope className="text-white w-7 h-7" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="font-black text-3xl tracking-tighter text-slate-950">Hi<span className="text-orange-600">Doctor</span></span>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400">Clinical Elite</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-12">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative text-sm font-black uppercase tracking-[0.15em] transition-all duration-300 group ${
                  location.pathname === link.path ? 'text-orange-600' : 'text-slate-500 hover:text-slate-950'
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-orange-600 to-red-600 transition-all duration-500 ${
                  location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
                }`}></span>
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-6">
            {isAuthenticated ? (
              <div className="flex items-center gap-6">
                <button className="relative p-2 text-slate-400 hover:text-orange-600 transition-colors">
                  <Bell className="w-6 h-6" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full" />
                </button>
                <div className="h-8 w-[1px] bg-slate-200" />
                <Button
                  onClick={() => navigate(getDashboardLink())}
                  className="bg-slate-950 hover:bg-orange-600 text-white rounded-2xl px-8 py-6 text-xs font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 shimmer-btn"
                >
                  Dashboard
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate('/login')}
                  variant="ghost"
                  className="text-slate-950 hover:text-orange-600 font-black text-xs uppercase tracking-widest px-6"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-orange-600 hover:bg-orange-700 text-white rounded-2xl px-10 py-6 text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 active:scale-95 transition-all shimmer-btn"
                >
                  Join Elite
                </Button>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-12 h-12 flex flex-col items-center justify-center gap-1.5"
          >
            <span className={`w-8 h-1 bg-slate-950 transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
            <span className={`w-8 h-1 bg-slate-950 transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-8 h-1 bg-slate-950 transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[90] bg-white lg:hidden"
          >
            <div className="pt-32 px-8 space-y-12">
              <div className="flex flex-col gap-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-5xl font-black text-slate-950 tracking-tighter hover:text-orange-600 transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="h-[1px] bg-slate-100" />
              <div className="flex flex-col gap-6">
                {isAuthenticated ? (
                  <Button onClick={() => { navigate(getDashboardLink()); setMobileMenuOpen(false); }} className="h-20 rounded-3xl bg-slate-950 text-white text-xl font-black">Dashboard</Button>
                ) : (
                  <>
                    <Button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }} variant="outline" className="h-20 rounded-3xl border-slate-200 text-xl font-black">Sign In</Button>
                    <Button onClick={() => { navigate('/register'); setMobileMenuOpen(false); }} className="h-20 rounded-3xl bg-orange-600 text-white text-xl font-black">Join Elite</Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export const Footer = () => {
  return (
    <footer className="relative bg-slate-950 text-white pt-40 pb-20 overflow-hidden border-t border-white/5">
      <div className="absolute top-0 left-0 w-full h-full mesh-orange-red opacity-10" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/20 blur-[150px] rounded-full" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/20 blur-[150px] rounded-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 mb-32">
          
          {/* Brand Hub */}
          <div className="lg:col-span-5 space-y-12">
            <Link to="/" className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Stethoscope className="text-white w-8 h-8" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="font-black text-4xl tracking-tighter text-white">Hi<span className="text-orange-500">Doctor</span></span>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">Excellence Unified</span>
              </div>
            </Link>
            <p className="text-slate-400 text-2xl font-bold leading-relaxed max-w-md italic">
              "We provide the bridge between clinical necessity and human care excellence."
            </p>
            <div className="flex gap-6">
              {[Facebook, Instagram, Youtube, Mail].map((Icon, i) => (
                <button key={i} className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center hover:bg-orange-600 hover:border-orange-600 transition-all group shadow-2xl">
                  <Icon className="w-6 h-6 text-slate-400 group-hover:text-white" />
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Matrix */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-16">
            <div className="space-y-10">
              <h4 className="font-black text-xs uppercase tracking-[0.4em] text-orange-500">Divisions</h4>
              <ul className="space-y-6 text-slate-300 font-bold text-lg">
                <li><Link to="/doctors" className="hover:text-orange-500 transition-colors">Elite Directory</Link></li>
                <li><Link to="/#specialties" className="hover:text-orange-500 transition-colors">Specialties</Link></li>
                <li><Link to="/telehealth" className="hover:text-orange-500 transition-colors">HD Telehealth</Link></li>
                <li><Link to="/labs" className="hover:text-orange-500 transition-colors">Lab Results</Link></li>
              </ul>
            </div>

            <div className="space-y-10">
              <h4 className="font-black text-xs uppercase tracking-[0.4em] text-red-500">Ecosystem</h4>
              <ul className="space-y-6 text-slate-300 font-bold text-lg">
                <li><Link to="/blog" className="hover:text-orange-500 transition-colors">Research Hub</Link></li>
                <li><Link to="/careers" className="hover:text-orange-500 transition-colors">Clinical Careers</Link></li>
                <li><Link to="/partners" className="hover:text-orange-500 transition-colors">Partner Clinics</Link></li>
                <li><Link to="/contact" className="hover:text-orange-500 transition-colors">Global Support</Link></li>
              </ul>
            </div>

            <div className="space-y-10">
              <h4 className="font-black text-xs uppercase tracking-[0.4em] text-slate-500">Standards</h4>
              <ul className="space-y-6 text-slate-300 font-bold text-lg">
                <li><Link to="/privacy" className="hover:text-orange-500 transition-colors">Data Privacy</Link></li>
                <li><Link to="/security" className="hover:text-orange-500 transition-colors">Cloud Security</Link></li>
                <li><Link to="/terms" className="hover:text-orange-500 transition-colors">Clinical TOS</Link></li>
                <li><Link to="/compliance" className="hover:text-orange-500 transition-colors">HIPAA Compliance</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-6 text-slate-500 font-black text-[10px] uppercase tracking-widest">
            <span>© 2026 HiDoctor Group</span>
            <div className="w-1.5 h-1.5 bg-orange-600 rounded-full" />
            <span>London / New York / Bangalore</span>
          </div>
          <div className="flex items-center gap-10">
             <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10">
                <Shield className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">ISO 27001 Certified</span>
             </div>
             <div className="flex items-center gap-3 bg-white/5 px-6 py-3 rounded-full border border-white/10">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Patient Safety First</span>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const AIAssistantWrapper = () => <AIAssistant />;

export const MobileNav = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const patientLinks = [
    { path: '/patient', icon: Home, label: 'Portal' },
    { path: '/doctors', icon: Search, label: 'Search' },
    { path: '/family-members', icon: Users, label: 'Network' },
    { path: '/settings', icon: Settings, label: 'Clinical' }
  ];

  const doctorLinks = [
    { path: '/doctor', icon: Home, label: 'Portal' },
    { path: '/settings', icon: Settings, label: 'Clinical' }
  ];

  const adminLinks = [
    { path: '/admin', icon: LayoutDashboard, label: 'System' },
    { path: '/settings', icon: Settings, label: 'Clinical' }
  ];

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'doctor' ? doctorLinks : patientLinks;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-slate-950/90 backdrop-blur-3xl border border-white/10 p-3 rounded-[2.5rem] md:hidden z-[100] shadow-2xl shadow-orange-600/20">
      <div className="flex justify-around items-center">
        {links.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 ${isActive ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
