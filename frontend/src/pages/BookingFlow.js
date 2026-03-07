import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Calendar } from '../components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Video,
  MapPin,
  Clock,
  User,
  Users,
  CreditCard,
  CheckCircle,
  Loader2,
  Home,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { format, addDays, isToday, parseISO } from 'date-fns';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const BOOKING_STEPS = [
  { id: 1, title: 'Visit Type', icon: Video },
  { id: 2, title: 'Date & Time', icon: Clock },
  { id: 3, title: 'Patient', icon: User },
  { id: 4, title: 'Details', icon: User },
  { id: 5, title: 'Payment', icon: CreditCard }
];



export default function BookingFlow() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [step, setStep] = useState(1);
  const [doctor, setDoctor] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [bookingData, setBookingData] = useState({
    consultation_type: 'in_person',
    appointment_date: null,
    appointment_time: '',
    patient_type: 'myself',
    family_member_id: null,
    reason: '',
    home_address: ''
  });

  useEffect(() => {
    fetchData();
  }, [doctorId]);

  useEffect(() => {
    if (bookingData.appointment_date) {
      fetchAvailableSlots(bookingData.appointment_date);
    }
  }, [bookingData.appointment_date]);

  const fetchAvailableSlots = async (date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const res = await axios.get(`${API_URL}/api/doctors/${doctorId}/available-slots?date=${dateStr}`);
      setAvailableSlots(res.data.slots || []);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
    }
  };

  const fetchData = async () => {
    try {
      const [doctorRes, familyRes] = await Promise.all([
        axios.get(`${API_URL}/api/doctors/${doctorId}`),
        axios.get(`${API_URL}/api/family-members`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setDoctor(doctorRes.data);
      setFamilyMembers(familyRes.data.members);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load booking data');
      navigate('/doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && bookingData.consultation_type === 'home_visit' && !bookingData.home_address) {
      toast.error('Please provide a home address for this visit type');
      return;
    }
    if (step === 2 && (!bookingData.appointment_date || !bookingData.appointment_time)) {
      toast.error('Please select a date and time');
      return;
    }
    if (step === 3 && bookingData.patient_type !== 'myself' && !bookingData.family_member_id) {
      toast.error('Please select a family member');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step === 1) {
      navigate(-1);
    } else {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const appointmentData = {
        doctor_id: doctorId,
        consultation_type: bookingData.consultation_type,
        appointment_date: format(bookingData.appointment_date, 'yyyy-MM-dd'),
        appointment_time: bookingData.appointment_time,
        reason: bookingData.reason,
        is_home_visit: bookingData.consultation_type === 'home_visit',
        home_address: bookingData.home_address,
        family_member_id: bookingData.patient_type !== 'myself' ? bookingData.family_member_id : null
      };

      const response = await axios.post(
        `${API_URL}/api/appointments`,
        appointmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const appointmentId = response.data.appointment.id;

      toast.success('Appointment booked successfully!');
      navigate(`/appointments/${appointmentId}`);

      /*
      // Create Razorpay checkout order
      const checkoutResponse = await axios.post(
        `${API_URL}/api/payments/razorpay/create-order`,
        { appointment_id: appointmentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const options = {
        key: checkoutResponse.data.key_id,
        amount: checkoutResponse.data.amount,
        currency: checkoutResponse.data.currency,
        name: "HiDoctor",
        description: "Appointment Booking",
        order_id: checkoutResponse.data.order_id,
        handler: async function (response) {
          try {
            await axios.post(
              `${API_URL}/api/payments/razorpay/verify`,
              response,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Payment successful! Your appointment is confirmed.');
            navigate(`/appointments/${appointmentId}`);
          } catch (error) {
            toast.error('Payment verification failed.');
            await axios.post(`${API_URL}/api/appointments/${appointmentId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setSubmitting(false);
          }
        },
        prefill: {
          name: user?.full_name || '',
          email: user?.email || ''
        },
        theme: { color: "#0d9488" },
        modal: {
          ondismiss: async function () {
            toast.error('Payment cancelled. Slot released.');
            await axios.post(`${API_URL}/api/appointments/${appointmentId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setSubmitting(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async function (response) {
        toast.error('Payment failed: ' + response.error.description);
        await axios.post(`${API_URL}/api/appointments/${appointmentId}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
        setSubmitting(false);
      });
      rzp.open();
      */
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error(error.response?.data?.detail || 'Failed to create appointment');
      setSubmitting(false);
    }
  };

  const handlePayLater = async () => {
    setSubmitting(true);
    try {
      const appointmentData = {
        doctor_id: doctorId,
        consultation_type: bookingData.consultation_type,
        appointment_date: format(bookingData.appointment_date, 'yyyy-MM-dd'),
        appointment_time: bookingData.appointment_time,
        reason: bookingData.reason,
        is_home_visit: bookingData.consultation_type === 'home_visit',
        home_address: bookingData.home_address,
        family_member_id: bookingData.patient_type !== 'myself' ? bookingData.family_member_id : null
      };

      const response = await axios.post(
        `${API_URL}/api/appointments`,
        appointmentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Appointment booked! Pay at clinic.');
      navigate(`/appointments/${response.data.appointment.id}`);
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error(error.response?.data?.detail || 'Failed to create appointment');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = (step / BOOKING_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background" data-testid="booking-flow">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Book Appointment</h1>
            <span className="text-sm text-muted-foreground">Step {step} of {BOOKING_STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-2" />

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {BOOKING_STEPS.map((s) => (
              <div
                key={s.id}
                className={`flex flex-col items-center ${s.id <= step ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${s.id < step ? 'bg-primary text-white' : s.id === step ? 'border-2 border-primary' : 'border border-muted-foreground'}`}
                >
                  {s.id < step ? <CheckCircle className="w-4 h-4" /> : s.id}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor Info Card */}
        <Card className="mb-6 border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              {doctor?.profile_image ? (
                <img src={doctor.profile_image} alt={doctor.full_name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-2xl font-bold text-primary">{doctor?.full_name?.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">{doctor?.title} {doctor?.full_name}</h3>
              <p className="text-sm text-muted-foreground">{doctor?.specialties?.[0]}</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold font-outfit text-slate-900 group-hover:text-orange-600 transition-colors">₹{doctor.consultation_fee}</span>
              <p className="text-xs text-muted-foreground">per visit</p>
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="border-border/50">
          <CardContent className="p-6">
            {/* Step 1: Visit Type */}
            {step === 1 && (
              <div className="space-y-6" data-testid="step-visit-type">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Select Visit Type</h2>
                  <RadioGroup
                    value={bookingData.consultation_type}
                    onValueChange={(value) => setBookingData({ ...bookingData, consultation_type: value })}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {doctor?.consultation_types?.includes('in_person') && (
                      <Label
                        htmlFor="in_person"
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${bookingData.consultation_type === 'in_person'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <RadioGroupItem value="in_person" id="in_person" className="sr-only" />
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">In-Person Visit</p>
                          <p className="text-sm text-muted-foreground">Visit the clinic</p>
                        </div>
                      </Label>
                    )}
                    {doctor?.consultation_types?.includes('telehealth') && (
                      <Label
                        htmlFor="telehealth"
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${bookingData.consultation_type === 'telehealth'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <RadioGroupItem value="telehealth" id="telehealth" className="sr-only" />
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                          <Video className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Video Consultation</p>
                          <p className="text-sm text-muted-foreground">Consult from home</p>
                        </div>
                      </Label>
                    )}
                    {doctor?.consultation_types?.includes('home_visit') && (
                      <Label
                        htmlFor="home_visit"
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${bookingData.consultation_type === 'home_visit'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <RadioGroupItem value="home_visit" id="home_visit" className="sr-only" />
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                          <Home className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">Home Visit</p>
                          <p className="text-sm text-muted-foreground">Doctor visits you</p>
                        </div>
                      </Label>
                    )}
                  </RadioGroup>

                  {bookingData.consultation_type === 'home_visit' && (
                    <div className="mt-6">
                      <Label htmlFor="home_address">Home Address</Label>
                      <Input
                        id="home_address"
                        placeholder="Enter full address for the visit..."
                        value={bookingData.home_address}
                        onChange={(e) => setBookingData({ ...bookingData, home_address: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Date & Time */}
            {step === 2 && (
              <div className="space-y-6" data-testid="step-datetime">
                <h2 className="text-xl font-semibold">Select Date & Time</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block">Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={bookingData.appointment_date}
                      onSelect={(date) => setBookingData({ ...bookingData, appointment_date: date })}
                      disabled={(date) => {
                        const today = new Date(new Date().setHours(0, 0, 0, 0));
                        return date < today || date > addDays(today, 30);
                      }}
                      className="rounded-md border"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">Select Time</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {bookingData.appointment_date && (() => {
                        if (availableSlots.length === 0) {
                          return <div className="col-span-3 text-sm text-destructive font-medium p-4 border rounded-xl text-center">Doctor unavailable on this day.</div>;
                        }

                        return availableSlots.map((slot) => {
                          let isPastTime = false;
                          if (isToday(bookingData.appointment_date)) {
                            const [hour, min] = slot.time.split(':').map(Number);
                            const slotTime = new Date();
                            slotTime.setHours(hour, min, 0, 0);
                            if (slotTime < new Date()) isPastTime = true;
                          }
                          const isUnavailable = !slot.is_available || isPastTime;

                          return (
                            <Button
                              key={slot.time}
                              type="button"
                              variant={bookingData.appointment_time === slot.time ? 'default' : 'outline'}
                              size="sm"
                              disabled={isUnavailable}
                              onClick={() => setBookingData({ ...bookingData, appointment_time: slot.time })}
                              className={`rounded-lg ${isUnavailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {slot.time}
                            </Button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Patient Selection */}
            {step === 3 && (
              <div className="space-y-6" data-testid="step-patient">
                <h2 className="text-xl font-semibold">Who is this appointment for?</h2>

                <RadioGroup
                  value={bookingData.patient_type}
                  onValueChange={(value) => setBookingData({ ...bookingData, patient_type: value, family_member_id: null })}
                  className="space-y-3"
                >
                  <Label
                    htmlFor="myself"
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${bookingData.patient_type === 'myself'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <RadioGroupItem value="myself" id="myself" className="sr-only" />
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Myself</p>
                      <p className="text-sm text-muted-foreground">{user?.full_name}</p>
                    </div>
                  </Label>

                  {familyMembers.length > 0 && (
                    <Label
                      htmlFor="family"
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${bookingData.patient_type === 'family'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <RadioGroupItem value="family" id="family" className="sr-only" />
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Family Member</p>
                        <p className="text-sm text-muted-foreground">{familyMembers.length} member(s) added</p>
                      </div>
                    </Label>
                  )}
                </RadioGroup>

                {bookingData.patient_type === 'family' && (
                  <div className="mt-4">
                    <Label className="mb-2 block">Select Family Member</Label>
                    <Select
                      value={bookingData.family_member_id || ''}
                      onValueChange={(value) => setBookingData({ ...bookingData, family_member_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a family member" />
                      </SelectTrigger>
                      <SelectContent>
                        {familyMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.full_name} ({member.relationship})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {familyMembers.length < 4 && (
                  <Button
                    variant="link"
                    onClick={() => navigate('/family-members')}
                    className="p-0 h-auto"
                  >
                    + Add family member ({familyMembers.length}/4)
                  </Button>
                )}
              </div>
            )}

            {/* Step 4: Details */}
            {step === 4 && (
              <div className="space-y-6" data-testid="step-details">
                <h2 className="text-xl font-semibold">Appointment Details</h2>

                <div>
                  <Label htmlFor="reason">Reason for Visit</Label>
                  <Textarea
                    id="reason"
                    placeholder="Briefly describe your symptoms or reason for consultation..."
                    value={bookingData.reason}
                    onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Payment */}
            {step === 5 && (
              <div className="space-y-6" data-testid="step-payment">
                <h2 className="text-xl font-semibold">Confirm & Pay</h2>

                {/* Booking Summary */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <h3 className="font-medium">Booking Summary</h3>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Doctor</span>
                    <span>{doctor?.title} {doctor?.full_name}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Specialty</span>
                    <span>{doctor?.specialties?.[0]}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="secondary">
                      {bookingData.consultation_type === 'telehealth'
                        ? 'Video Call'
                        : bookingData.consultation_type === 'home_visit'
                          ? 'Home Visit'
                          : 'In-Person'}
                    </Badge>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span>{bookingData.appointment_date ? format(bookingData.appointment_date, 'EEEE, dd-MM-yyyy') : '-'}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span>{bookingData.appointment_time}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Patient</span>
                    <span>
                      {bookingData.patient_type === 'myself'
                        ? user?.full_name
                        : familyMembers.find(m => m.id === bookingData.family_member_id)?.full_name}
                    </span>
                  </div>

                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-primary">₹{doctor?.consultation_fee}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Options */}
                <div className="space-y-3">
                  {bookingData.consultation_type === 'telehealth' && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4 text-sm text-blue-800 flex gap-2 items-start">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
                      <p>
                        <strong>Note:</strong> Video calls are currently limited to 5 minutes.
                        A future update will increase the time limit in subscription tiers.
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full rounded-full gap-2"
                    onClick={handleSubmit}
                    disabled={submitting}
                    data-testid="pay-now-btn"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Confirm Appointment (Pay at Clinic)
                      </>
                    )}
                  </Button>

                  {/* bookingData.consultation_type !== 'telehealth' && (
                    <Button
                      variant="outline"
                      className="w-full rounded-full"
                      onClick={handlePayLater}
                      disabled={submitting}
                      data-testid="pay-later-btn"
                    >
                      Pay Later at Clinic
                    </Button>
                  ) */}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button variant="ghost" onClick={handleBack} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              {step < 5 && (
                <Button onClick={handleNext} className="gap-2 rounded-full">
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
