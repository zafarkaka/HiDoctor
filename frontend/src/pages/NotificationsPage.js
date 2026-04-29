import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, MobileNav, Footer } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { 
  Bell, 
  Calendar, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle,
  Megaphone,
  Zap,
  Activity,
  Shield,
  ChevronRight,
  Clock,
  Check
} from 'lucide-react';
import axios from 'axios';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function NotificationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching clinical signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking signal as processed:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error batch processing signals:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.type === 'appointment' && notification.data?.appointment_id) {
      navigate(`/appointments/${notification.data.appointment_id}`);
    } else if (notification.type === 'message' && notification.data?.appointment_id) {
      navigate(`/appointments/${notification.data.appointment_id}`);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-6 h-6 text-orange-600" />;
      case 'message': return <MessageSquare className="w-6 h-6 text-blue-500" />;
      case 'system': return <Shield className="w-6 h-6 text-red-500" />;
      case 'blog': return <Megaphone className="w-6 h-6 text-green-500" />;
      default: return <Bell className="w-6 h-6 text-slate-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#fcfdfd] font-jakarta overflow-x-hidden scale-[0.95] origin-top pb-24 md:pb-0">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-24">
        
        {/* ELITE NOTIFICATIONS HEADER */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-slate-950 rounded-[3.5rem] p-12 md:p-16 border border-white/5 shadow-2xl overflow-hidden mb-12"
        >
          <div className="absolute inset-0 mesh-orange-red opacity-20" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4 text-center md:text-left">
               <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-4 py-1.5 rounded-full">
                  <Activity className="w-4 h-4 text-orange-500 animate-pulse" />
                  <span className="text-orange-400 text-[10px] font-black uppercase tracking-widest">Signal Processing Center</span>
               </div>
               <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none">
                 My Alerts.
               </h1>
               <p className="text-slate-400 text-lg font-bold italic border-l-2 border-orange-500/30 pl-5">
                 "Monitoring real-time clinical events and ecosystem signals."
               </p>
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="ghost" className="bg-white/5 text-white border border-white/10 rounded-2xl px-8 py-6 font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-slate-950 transition-all shadow-xl active:scale-95">
                 Synchronize All
              </Button>
            )}
          </div>
        </motion.section>

        <div className="space-y-8">
           <div className="flex items-center justify-between px-6">
              <h2 className="text-2xl font-black text-slate-950 tracking-tight">Real-time Feed</h2>
              <Badge className="bg-orange-600 text-white font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                 {unreadCount} UNREAD SIGNALS
              </Badge>
           </div>

           {loading ? (
             <div className="space-y-4 px-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-[2rem] bg-slate-50" />)}
             </div>
           ) : notifications.length > 0 ? (
             <div className="grid gap-4">
                {notifications.map((notification, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`group relative p-8 rounded-[2.5rem] border transition-all cursor-pointer overflow-hidden ${
                       !notification.is_read 
                       ? 'bg-white border-orange-200 shadow-xl scale-[1.02] z-10' 
                       : 'bg-white/50 border-slate-100 hover:bg-white hover:shadow-lg'
                    }`}
                  >
                    {!notification.is_read && <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full opacity-50 -z-10" />}
                    
                    <div className="flex items-center gap-8 relative z-10">
                       <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-sm relative transition-transform group-hover:rotate-6 ${
                          !notification.is_read ? 'bg-orange-600 text-white shadow-orange-200' : 'bg-slate-100 text-slate-400'
                       }`}>
                          {getIcon(notification.type)}
                          {!notification.is_read && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 border-4 border-white rounded-full" />}
                       </div>

                       <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                             <h3 className={`text-xl font-black tracking-tight ${!notification.is_read ? 'text-slate-950' : 'text-slate-500'}`}>
                                {notification.title}
                             </h3>
                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3 h-3" /> {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}
                             </span>
                          </div>
                          <p className={`text-sm font-bold leading-relaxed italic ${!notification.is_read ? 'text-slate-600' : 'text-slate-400'}`}>
                             "{notification.message}"
                          </p>
                       </div>

                       <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-6 h-6 text-orange-600" />
                       </div>
                    </div>
                  </motion.div>
                ))}
             </div>
           ) : (
             <div className="text-center py-24 bg-slate-50 rounded-[4rem] border border-slate-100 space-y-8">
                <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl"><Bell className="w-12 h-12 text-slate-100" /></div>
                <div className="space-y-3">
                   <h3 className="text-3xl font-black text-slate-950 tracking-tight">Nexus Silent</h3>
                   <p className="text-slate-400 font-bold text-sm italic max-w-sm mx-auto">"All clinical signals have been synchronized. Your feed is clear."</p>
                </div>
             </div>
           )}
        </div>
      </main>

      <MobileNav />
      <Footer />
    </div>
  );
}
