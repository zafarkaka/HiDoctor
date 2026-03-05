import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, MobileNav, Footer } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Bell,
  ArrowRight,
  Search,
  Plus,
  Home
} from 'lucide-react';
import { Calendar as CalendarUI } from '../components/ui/calendar';
import axios from 'axios';
import { format, parseISO, isToday, isTomorrow, isSameDay } from 'date-fns';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function PatientDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [familyCount, setFamilyCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsRes, familyRes] = await Promise.all([
        axios.get(`${API_URL}/api/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/family-members`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setAppointments(appointmentsRes.data.appointments);
      setFamilyCount(familyRes.data.count);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateLabel = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'dd-MM-yyyy');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const upcomingAppointments = appointments.filter(
    apt => ['pending', 'confirmed'].includes(apt.status) && new Date(apt.appointment_date) >= new Date().setHours(0, 0, 0, 0)
  ).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

  const selectedDateAppointments = appointments.filter(
    apt => isSameDay(parseISO(apt.appointment_date), selectedDate)
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0" data-testid="patient-dashboard">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">Here's an overview of your health journey</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card
            className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-border/50"
            onClick={() => navigate('/doctors')}
            data-testid="quick-action-find-doctor"
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <span className="font-medium">Find Doctor</span>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-border/50"
            onClick={() => navigate('/family-members')}
            data-testid="quick-action-family"
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="font-medium">Family ({familyCount}/4)</span>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-border/50"
            onClick={() => navigate('/notifications')}
            data-testid="quick-action-notifications"
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <span className="font-medium">Notifications</span>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all border-border/50"
            onClick={() => navigate('/blog')}
            data-testid="quick-action-blog"
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <span className="font-medium">Health Blog</span>
            </CardContent>
          </Card>
        </div>

        {/* Calendar and Appointments View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Calendar Pane */}
          <Card className="border-border/50 lg:col-span-1 border shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="text-xl">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center flex-col items-center">
              <CalendarUI
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={{
                  hasAppointment: appointments.map(apt => new Date(apt.appointment_date))
                }}
                modifiersStyles={{
                  hasAppointment: { textDecoration: 'underline', textDecorationColor: 'hsl(var(--primary))', textDecorationThickness: '3px', textUnderlineOffset: '4px', fontWeight: 'bold' }
                }}
                className="rounded-md border shadow w-full flex justify-center p-3"
              />
            </CardContent>
          </Card>

          {/* Appointments List */}
          <Card className="border-border/50 lg:col-span-2 shadow-sm h-fit">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">
                Upcoming Appointments
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/doctors')} className="gap-1">
                <Plus className="w-4 h-4" /> Book New
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => navigate(`/appointments/${apt.id}`)}
                      className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      data-testid={`appointment-${apt.id}`}
                    >
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary">
                        <span className="text-xs font-medium">{format(parseISO(apt.appointment_date), 'MMM')}</span>
                        <span className="text-lg font-bold">{format(parseISO(apt.appointment_date), 'd')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold truncate">{apt.doctor?.full_name || 'Doctor'}</h3>
                          <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                          {isToday(parseISO(apt.appointment_date)) && (
                            <Badge variant="destructive" className="ml-auto">Today</Badge>
                          )}
                        </div>
                        <p className="text-sm text-foreground font-medium mb-1">
                          {format(parseISO(apt.appointment_date), 'EEEE, dd-MM-yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {apt.doctor?.specialties?.[0] || 'General Medicine'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {apt.appointment_time}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-orange-600">
                            ₹{apt.payment_amount}
                          </span>
                          <span className="flex items-center gap-1">
                            {apt.consultation_type === 'telehealth' ? (
                              <><Video className="w-4 h-4" /> Video</>
                            ) : apt.consultation_type === 'home_visit' ? (
                              <><Home className="w-4 h-4" /> Home Visit</>
                            ) : (
                              <><MapPin className="w-4 h-4" /> In-person</>
                            )}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">No appointments on this date</h3>
                  <p className="text-muted-foreground mb-4">You have a clear schedule for {format(selectedDate, 'dd-MM-yyyy')}.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-muted/50 text-center">
                <p className="text-3xl font-bold text-primary">{appointments.length}</p>
                <p className="text-sm text-muted-foreground">Total Appointments</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {appointments.filter(a => a.status === 'completed').length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 text-center">
                <p className="text-3xl font-bold text-amber-600">
                  {appointments.filter(a => a.status === 'pending').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 text-center">
                <p className="text-3xl font-bold text-blue-600">{familyCount}</p>
                <p className="text-sm text-muted-foreground">Family Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <MobileNav />
    </div>
  );
}
