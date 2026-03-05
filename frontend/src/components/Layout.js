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
  Smartphone
} from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const Navbar = () => {
  const { user, logout, isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    const routes = { patient: '/patient', doctor: '/doctor', admin: '/admin' };
    return routes[user.role] || '/';
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 glass-premium border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center group-hover:scale-110 transition-all shadow-lg border-2 border-white/50">
              <img src="/logo.png" alt="HiDoctor" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-2xl tracking-tight hidden sm:block font-outfit text-slate-900">HiDoctor</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/doctors" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Find Doctors
            </Link>
            <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Blog
            </Link>
            <a
              href="/download/hidoctor.apk"
              className="px-6 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-all font-semibold flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
              download
            >
              <Smartphone className="w-4 h-4" />
              Download App
            </a>

            {isAuthenticated ? (
              <>
                <Link to="/notifications" className="relative">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-orange-600">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(user?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium hidden lg:block">{user?.full_name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/register')}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fadeIn">
            <div className="flex flex-col gap-2">
              <Link
                to="/doctors"
                className="px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Find Doctors
              </Link>
              <Link
                to="/blog"
                className="px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Blog
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    className="px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/notifications"
                    className="px-4 py-2 rounded-lg hover:bg-muted transition-colors flex items-center justify-between"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Notifications
                    {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
                  </Link>
                  <Link
                    to="/settings"
                    className="px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="px-4 py-2 rounded-lg hover:bg-destructive/10 text-destructive text-left transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <Button variant="outline" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>
                    Sign In
                  </Button>
                  <Button onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}>
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// AI Assistant wrapper - included in all layouts
export const AIAssistantWrapper = () => <AIAssistant />;

export const MobileNav = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const patientLinks = [
    { path: '/patient', icon: Home, label: 'Home' },
    { path: '/doctors', icon: Search, label: 'Search' },
    { path: '/family-members', icon: Users, label: 'Family' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  const doctorLinks = [
    { path: '/doctor', icon: Home, label: 'Home' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  const adminLinks = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'doctor' ? doctorLinks : patientLinks;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border p-2 pb-safe md:hidden z-50">
      <div className="flex justify-around items-center">
        {links.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
                <img src="/logo.png" alt="HiDoctor" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-2xl font-outfit">HiDoctor</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Your trusted healthcare companion. Book appointments, consult doctors, and manage your health journey.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For Patients</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/doctors" className="hover:text-foreground transition-colors">Find Doctors</Link></li>
              <li><Link to="/blog" className="hover:text-foreground transition-colors">Health Blog</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition-colors">Create Account</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">For Doctors</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/register" className="hover:text-foreground transition-colors">Join as Doctor</Link></li>
              <li><Link to="/blog" className="hover:text-foreground transition-colors">Resources</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://wa.me/919894977003" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  WhatsApp
                </a>
              </li>
              <li>
                <a href="mailto:support@hidoctor.app" className="hover:text-foreground transition-colors flex items-center gap-2">
                  ✉️ Email Support
                </a>
              </li>
              <li><span className="cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span></li>
              <li><span className="cursor-pointer hover:text-foreground transition-colors">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 HiDoctor. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground text-center md:text-right">
            Medical Disclaimer: This platform is not a substitute for emergency medical care.
          </p>
        </div>
      </div>
    </footer>
  );
};
