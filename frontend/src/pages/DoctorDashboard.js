import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, MobileNav } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  Bell,
  ArrowRight,
  IndianRupee,
  CheckCircle,
  AlertCircle,
  Settings,
  Plus,
  X,
  Home
} from 'lucide-react';
import { Calendar as CalendarUI } from '../components/ui/calendar';
import axios from 'axios';
import { format, parseISO, isToday, isTomorrow, isSameDay } from 'date-fns';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function DoctorDashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [holidays, setHolidays] = useState([]);
  const [workingHours, setWorkingHours] = useState({
    monday: { active: true, slots: [{ start: '09:00', end: '17:00' }] },
    tuesday: { active: true, slots: [{ start: '09:00', end: '17:00' }] },
    wednesday: { active: true, slots: [{ start: '09:00', end: '17:00' }] },
    thursday: { active: true, slots: [{ start: '09:00', end: '17:00' }] },
    friday: { active: true, slots: [{ start: '09:00', end: '17:00' }] },
    saturday: { active: false, slots: [{ start: '10:00', end: '14:00' }] },
    sunday: { active: false, slots: [{ start: '10:00', end: '14:00' }] }
  });
  const [savingHolidays, setSavingHolidays] = useState(false);

  useEffect(() => {
    fetchData();
    fetchHolidays();
  }, []);

  const fetchHolidays = async () => {
    try {
      const holidayRes = await axios.get(`${API_URL}/api/doctors/holidays`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (holidayRes.data.holidays) {
        setHolidays(holidayRes.data.holidays.map(d => parseISO(d)));
      }

      const hoursRes = await axios.get(`${API_URL}/api/doctors/working-hours`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (hoursRes.data.working_hours && Object.keys(hoursRes.data.working_hours).length > 0) {
        setWorkingHours(hoursRes.data.working_hours);
      }
    } catch (error) {
      console.error('Error fetching schedules', error);
    }
  };

  const handleSaveHolidays = async () => {
    setSavingHolidays(true);
    try {
      const formattedHolidays = holidays.map(date => format(date, 'yyyy-MM-dd'));

      await Promise.all([
        axios.put(`${API_URL}/api/doctors/holidays`, { holidays: formattedHolidays }, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.put(`${API_URL}/api/doctors/working-hours`, { working_hours: workingHours }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      toast.success('Availability settings saved!');
    } catch (error) {
      toast.error('Failed to save schedule configurations');
    } finally {
      setSavingHolidays(false);
    }
  };

  const toggleHoliday = (day) => {
    if (!day) return;
    const isAlreadyHoliday = holidays.some(h => isSameDay(h, day));
    if (isAlreadyHoliday) {
      setHolidays(holidays.filter(h => !isSameDay(h, day)));
    } else {
      setHolidays([...holidays, day]);
    }
  };

  const fetchData = async () => {
    try {
      const [appointmentsRes, profileRes] = await Promise.all([
        axios.get(`${API_URL}/api/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/doctors/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null)
      ]);

      setAppointments(appointmentsRes.data.appointments);
      setDoctorProfile(profileRes?.data);

      // Redirect to onboarding if profile not complete
      if (!profileRes?.data?.license_number) {
        navigate('/doctor/onboarding');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      await axios.put(
        `${API_URL}/api/appointments/${appointmentId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Appointment ${status}`);
      fetchData();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
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

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');
  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');

  const todayAppointments = appointments.filter(apt => {
    return isToday(parseISO(apt.appointment_date)) && ['pending', 'confirmed'].includes(apt.status);
  });

  const selectedDateAppointments = appointments.filter(apt =>
    isSameDay(parseISO(apt.appointment_date), selectedDate)
  ).sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

  if (!doctorProfile?.is_verified && doctorProfile?.license_number) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Profile Under Review</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Your profile is being reviewed by our team. You'll be notified once approved and can start receiving appointments.
          </p>
          <Button variant="outline" onClick={() => navigate('/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            View Profile
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0" data-testid="doctor-dashboard">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, Dr. {user?.full_name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">Here's your practice overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingAppointments.length}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{confirmedAppointments.length}</p>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayAppointments.length}</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{doctorProfile?.consultation_fee || 0}</p>
                  <p className="text-sm text-muted-foreground">Fee</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar and Appointments View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="border-border/50 lg:col-span-1 shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="text-xl">Calendar</CardTitle>
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

          <Card className="border-border/50 lg:col-span-2 shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="text-xl">
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map(apt => (
                    <div
                      key={apt.id}
                      onClick={() => navigate(`/appointments/${apt.id}`)}
                      className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary flex-shrink-0">
                        <span className="text-xs font-medium text-orange-600">{format(parseISO(apt.appointment_date), 'MMM')}</span>
                        <span className="text-lg font-bold text-orange-600">{format(parseISO(apt.appointment_date), 'd')}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold truncate">{apt.patient?.full_name || 'Patient'}</h3>
                          <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                          {isToday(parseISO(apt.appointment_date)) && (
                            <Badge variant="destructive" className="ml-auto">Today</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          {format(parseISO(apt.appointment_date), 'EEEE, dd-MM-yyyy')}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {apt.appointment_time}
                          </span>
                          <span className="flex items-center gap-1">
                            {apt.consultation_type === 'home_visit' ? (
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
                  <h3 className="font-semibold mb-2">No appointments</h3>
                  <p className="text-muted-foreground mb-4">You have no appointments scheduled for this date.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Appointments Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="flex-1 gap-2">
              Pending
              {pendingAppointments.length > 0 && (
                <Badge className="bg-amber-500">{pendingAppointments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="flex-1">Confirmed</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 hidden sm:block">Completed</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">Availability</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Pending Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                  </div>
                ) : pendingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {pendingAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary flex-shrink-0">
                          <span className="text-xs font-medium">{format(parseISO(apt.appointment_date), 'MMM')}</span>
                          <span className="text-lg font-bold">{format(parseISO(apt.appointment_date), 'd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{apt.patient?.full_name || 'Patient'}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {apt.appointment_time}
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
                          {apt.reason && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{apt.reason}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                            className="rounded-full"
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                            className="rounded-full"
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No pending appointments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confirmed">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Confirmed Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {confirmedAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {confirmedAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => navigate(`/appointments/${apt.id}`)}
                        className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      >
                        <div className="w-14 h-14 rounded-xl bg-green-100 flex flex-col items-center justify-center text-green-600 flex-shrink-0">
                          <span className="text-xs font-medium">{format(parseISO(apt.appointment_date), 'MMM')}</span>
                          <span className="text-lg font-bold">{format(parseISO(apt.appointment_date), 'd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{apt.patient?.full_name || 'Patient'}</h3>
                            <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {apt.appointment_time}
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
                    <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No confirmed appointments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Completed Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                {completedAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {completedAppointments.slice(0, 10).map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => navigate(`/appointments/${apt.id}`)}
                        className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      >
                        <div className="w-14 h-14 rounded-xl bg-blue-100 flex flex-col items-center justify-center text-blue-600 flex-shrink-0">
                          <span className="text-xs font-medium">{format(parseISO(apt.appointment_date), 'MMM')}</span>
                          <span className="text-lg font-bold">{format(parseISO(apt.appointment_date), 'd')}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{apt.patient?.full_name || 'Patient'}</h3>
                          <p className="text-sm text-muted-foreground">{apt.appointment_time}</p>
                        </div>
                        <Badge className={getStatusColor(apt.status)}>{apt.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No completed appointments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability / Settings Tab */}
          <TabsContent value="settings">
            <Card className="border-border/50">
              <CardHeader className="border-b">
                <CardTitle>Manage Availability & Hours</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid lg:grid-cols-2 gap-12">

                  {/* Calendar / Holiday Picker section */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold mb-1">Time Off / Holidays</h3>
                      <p className="text-sm text-muted-foreground mb-4">Click dates on the calendar to mark them as unavailable.</p>
                      <div className="flex justify-center bg-card border rounded-xl p-4 shadow-sm">
                        <CalendarUI
                          mode="multiple"
                          selected={holidays}
                          onSelect={(days) => setHolidays(days || [])}
                          className="w-full max-w-[280px]"
                        />
                      </div>
                    </div>

                    <div className="bg-muted/30 p-4 rounded-xl border border-dashed text-center">
                      <h4 className="font-semibold text-sm mb-3 text-left">Selected Holidays</h4>
                      {holidays.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {holidays.sort((a, b) => a - b).map((h, i) => (
                            <Badge key={i} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                              {format(h, 'dd-MM-yyyy')}
                              <button onClick={() => toggleHoliday(h)} className="text-muted-foreground hover:text-foreground">
                                <AlertCircle className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground font-medium py-3">No specific dates blocked.</p>
                      )}
                    </div>
                  </div>

                  {/* Weekly Working Hours section */}
                  <div>
                    <h3 className="text-xl font-bold mb-1">Weekly Standard Hours</h3>
                    <p className="text-sm text-muted-foreground mb-6">Define your standard recurring operational hours block.</p>

                    <div className="space-y-4 mb-8">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                        const dayData = workingHours[day] || { active: false, slots: [] };
                        return (
                          <div key={day} className="flex flex-col p-4 border rounded-xl bg-card shadow-sm hover:border-primary/50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <label className="flex items-center gap-3 font-semibold capitalize cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 rounded border-primary"
                                  checked={dayData.active}
                                  onChange={(e) => setWorkingHours(prev => ({
                                    ...prev, [day]: { ...(prev[day] || { slots: [{ start: '09:00', end: '17:00' }] }), active: e.target.checked }
                                  }))}
                                />
                                {day}
                              </label>
                              {dayData.active && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newSlots = [...(Array.isArray(dayData.slots) ? dayData.slots : []), { start: '09:00', end: '17:00' }];
                                    setWorkingHours(prev => ({ ...prev, [day]: { ...(prev[day] || {}), slots: newSlots } }));
                                  }}
                                  className="h-8 gap-1 text-xs"
                                >
                                  <Plus className="w-3 h-3" /> Add Shift
                                </Button>
                              )}
                            </div>

                            {dayData.active ? (
                              <div className="space-y-2 mt-2">
                                {(Array.isArray(dayData.slots) ? dayData.slots : []).map((slot, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded-lg">
                                    <span className="text-muted-foreground font-mono text-xs w-6">#{idx + 1}</span>
                                    <input
                                      type="time"
                                      value={slot.start}
                                      onChange={(e) => {
                                        const newSlots = [...(Array.isArray(dayData.slots) ? dayData.slots : [])];
                                        newSlots[idx] = { ...newSlots[idx], start: e.target.value };
                                        setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], slots: newSlots } }));
                                      }}
                                      className="border rounded-md px-2 py-1 text-center bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    <span className="text-muted-foreground font-medium px-1">to</span>
                                    <input
                                      type="time"
                                      value={slot.end}
                                      onChange={(e) => {
                                        const newSlots = [...(Array.isArray(dayData.slots) ? dayData.slots : [])];
                                        newSlots[idx] = { ...newSlots[idx], end: e.target.value };
                                        setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], slots: newSlots } }));
                                      }}
                                      className="border rounded-md px-2 py-1 text-center bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                    {(Array.isArray(dayData.slots) ? dayData.slots : []).length > 1 && (
                                      <button
                                        onClick={() => {
                                          const newSlots = (Array.isArray(dayData.slots) ? dayData.slots : []).filter((_, i) => i !== idx);
                                          setWorkingHours(prev => ({ ...prev, [day]: { ...prev[day], slots: newSlots } }));
                                        }}
                                        className="ml-auto text-destructive hover:bg-destructive/10 p-1 rounded"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm font-medium text-muted-foreground italic py-2">
                                Off Duty (No shifts available)
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/50">
                      <Button
                        size="lg"
                        className="w-full sm:w-auto px-8"
                        onClick={handleSaveHolidays}
                        disabled={savingHolidays}
                      >
                        {savingHolidays ? 'Saving Configuration...' : 'Save Availability & Hours'}
                      </Button>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <MobileNav />
    </div>
  );
}
