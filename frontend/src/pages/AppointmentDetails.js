import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, MobileNav } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  ChevronLeft,
  Video,
  MapPin,
  Clock,
  Calendar,
  MessageSquare,
  Send,
  X,
  Check,
  AlertCircle,
  CreditCard,
  Loader2,
  Paperclip,
  Star,
  Home
} from 'lucide-react';
import axios from 'axios';
import { format, parseISO, isToday } from 'date-fns';
import { toast } from 'sonner';
import AudioCallWidget from '../components/AudioCallWidget';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AppointmentDetails() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAppointment();

    // Check payment status from URL
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');

    if (paymentStatus === 'success' && sessionId) {
      handlePaymentSuccess(sessionId);
    } else if (paymentStatus === 'cancelled') {
      toast.info('Payment was cancelled');
    }
  }, [appointmentId]);

  useEffect(() => {
    if (appointment) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [appointment]);

  useEffect(() => {
    if (appointment && appointment.status === 'completed' && user?.role === 'patient') {
      fetchCanReview();
    }
  }, [appointment, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchAppointment = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/appointments/${appointmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointment(response.data);
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error('Appointment not found');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/appointments/${appointmentId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handlePaymentSuccess = async (sessionId) => {
    try {
      const response = await axios.get(`${API_URL}/api/payments/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment_status === 'paid') {
        toast.success('Payment successful! Your appointment is confirmed.');
        fetchAppointment();
      }
    } catch (error) {
      console.error('Error checking payment:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;

    setSending(true);
    try {
      await axios.post(
        `${API_URL}/api/appointments/${appointmentId}/messages`,
        { message: newMessage, file_url: attachment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewMessage('');
      setAttachment(null);
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const response = await axios.post(`${API_URL}/api/chat/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setAttachment(response.data.file_url);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchCanReview = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/doctors/${appointment.doctor_id}/can-review`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ensure the review belongs to exactly THIS appointment or allows general reviewing
      if (data.can_review && data.appointment_id === appointmentId) setCanReview(true);
    } catch (error) { console.error('Error fetching review eligibility', error); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await axios.post(
        `${API_URL}/api/doctors/${appointment.doctor_id}/reviews`,
        {
          doctor_id: appointment.doctor_id,
          appointment_id: appointment.id,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Review submitted successfully!');
      setCanReview(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      const detail = error.response?.data?.detail;
      let errorMessage = 'Failed to submit review';

      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map(err => err.msg).join(', ');
      } else if (detail && typeof detail === 'object') {
        errorMessage = detail.message || JSON.stringify(detail);
      }

      toast.error(errorMessage);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      await axios.put(
        `${API_URL}/api/appointments/${appointmentId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Appointment ${status}`);
      fetchAppointment();
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      await axios.post(
        `${API_URL}/api/appointments/${appointmentId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Appointment cancelled');
      fetchAppointment();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error(error.response?.data?.detail || 'Failed to cancel appointment');
    }
  };

  const handleJoinCall = () => {
    if (appointment?.jitsi_room_id) {
      navigate(`/video-call/${appointmentId}`);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-green-100 text-green-700',
      completed: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
      no_show: 'bg-gray-100 text-gray-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getPaymentBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      paid: 'bg-green-100 text-green-700',
      refunded: 'bg-blue-100 text-blue-700',
      failed: 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!appointment) return null;

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';
  const canJoinCall = appointment.consultation_type === 'telehealth' &&
    appointment.status === 'confirmed' &&
    appointment.jitsi_room_id;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0" data-testid="appointment-details">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>

          {canJoinCall && (
            <div className="flex flex-col items-end gap-2">
              <Button onClick={handleJoinCall} className="gap-2 rounded-full bg-green-600 hover:bg-green-700">
                <Video className="w-4 h-4" />
                Join Video Call
              </Button>
              <p className="text-[10px] text-muted-foreground bg-blue-50 px-2 py-1 rounded border border-blue-100">
                Notice: Video calls limited to 5 mins.
              </p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointment Card */}
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl mb-2 flex items-center gap-2">
                      Appointment Details
                      <Badge variant="outline" className="font-mono text-muted-foreground ml-2">
                        #{appointment.hex_reference || appointment.id.split('-')[0].toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={getStatusBadge(appointment.status)}>
                        {appointment.status}
                      </Badge>
                      <Badge className={getPaymentBadge(appointment.payment_status)}>
                        {appointment.payment_status === 'paid' ? 'Paid' : 'Payment ' + appointment.payment_status}
                      </Badge>
                      {appointment.appointment_date && isToday(parseISO(appointment.appointment_date)) && (
                        <Badge variant="destructive" className="ml-auto">Today</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {format(parseISO(appointment.appointment_date), 'EEEE, dd-MM-yyyy')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{appointment.appointment_time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    {appointment.consultation_type === 'telehealth' ? (
                      <Video className="w-5 h-5 text-green-600" />
                    ) : appointment.consultation_type === 'home_visit' ? (
                      <Home className="w-5 h-5 text-purple-600" />
                    ) : (
                      <MapPin className="w-5 h-5 text-blue-600" />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">
                        {appointment.consultation_type === 'telehealth' ? 'Video Consultation' : appointment.consultation_type === 'home_visit' ? 'Home Visit' : 'In-Person Visit'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fee</p>
                      <p className="font-medium">₹{appointment.payment_amount}</p>
                    </div>
                  </div>
                </div>

                {appointment.reason && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Reason for Visit</p>
                    <p>{appointment.reason}</p>
                  </div>
                )}

                {appointment.patient_notes && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Patient Notes</p>
                    <p>{appointment.patient_notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  {isDoctor && appointment.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleStatusUpdate('confirmed')}
                        className="gap-2 rounded-full"
                      >
                        <Check className="w-4 h-4" />
                        Confirm
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate('cancelled')}
                        className="gap-2 rounded-full"
                      >
                        <X className="w-4 h-4" />
                        Decline
                      </Button>
                    </>
                  )}

                  {isDoctor && appointment.status === 'confirmed' && (
                    <Button
                      onClick={() => handleStatusUpdate('completed')}
                      className="gap-2 rounded-full"
                    >
                      <Check className="w-4 h-4" />
                      Mark Complete
                    </Button>
                  )}

                  {isPatient && ['pending', 'confirmed'].includes(appointment.status) && (
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="gap-2 rounded-full text-destructive"
                    >
                      <X className="w-4 h-4" />
                      Cancel Appointment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat Section */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Messages
                </CardTitle>
                <div className="w-full sm:w-auto min-w-[300px]">
                  <AudioCallWidget appointmentId={appointmentId} currentUserId={user?.id} />
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-80 pr-4">
                  {messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${msg.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                              }`}
                          >
                            <p className="text-xs opacity-70 mb-1">{msg.sender_name}</p>
                            {msg.file_url && (
                              <img
                                src={`${API_URL}${msg.file_url}`}
                                alt="attachment"
                                className="max-w-full rounded-md mb-2 object-contain"
                                style={{ maxHeight: '150px' }}
                              />
                            )}
                            {msg.message && <p>{msg.message}</p>}
                            <p className="text-xs opacity-70 mt-1">
                              {format(parseISO(msg.created_at), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No messages yet</p>
                    </div>
                  )}
                </ScrollArea>

                {attachment && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={`${API_URL}${attachment}`}
                      alt="preview"
                      className="h-16 rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <form onSubmit={sendMessage} className="mt-4 flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || sending}
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending || uploading}
                  />
                  <Button type="submit" size="icon" disabled={sending || uploading || (!newMessage.trim() && !attachment)}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Doctor/Patient Info */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">{isPatient ? 'Doctor' : 'Patient'}</CardTitle>
              </CardHeader>
              <CardContent>
                {isPatient && appointment.doctor && (
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {appointment.doctor.profile_image ? (
                        <img
                          src={appointment.doctor.profile_image}
                          alt={appointment.doctor.full_name}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-xl font-bold text-primary">
                          {appointment.doctor.full_name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{appointment.doctor.title || 'Dr.'} {appointment.doctor.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.doctor.specialties?.[0] || 'General Medicine'}
                      </p>
                    </div>
                  </div>
                )}

                {isDoctor && appointment.patient && (
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-primary">
                        {appointment.patient.full_name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{appointment.patient.full_name}</p>
                      <p className="text-sm text-muted-foreground">{appointment.patient.email}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Family Member Info */}
            {appointment.family_member && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Patient (Family Member)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{appointment.family_member.full_name}</p>
                  <p className="text-sm text-muted-foreground">{appointment.family_member.relationship}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            {canJoinCall && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-medium text-green-800 mb-3">Video consultation ready</p>
                  <Button
                    onClick={handleJoinCall}
                    className="w-full gap-2 rounded-full bg-green-600 hover:bg-green-700"
                  >
                    <Video className="w-4 h-4" />
                    Join Now
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Review Section */}
            {canReview && (
              <Card className="border-border/50 bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Rate Your Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={submitReview} className="space-y-4">
                    <div className="flex gap-2 justify-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="How was your consultation with the doctor?"
                      className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary h-24"
                      required
                    />
                    <Button type="submit" disabled={submittingReview} className="w-full">
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
