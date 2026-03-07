import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, Footer } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Calendar } from '../components/ui/calendar';
import { Textarea } from '../components/ui/textarea';
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Mail,
  Award,
  Languages,
  Shield,
  MessageSquare,
  ChevronLeft,
  CheckCircle,
  Home
} from 'lucide-react';
import axios from 'axios';
import { format, parseISO, isSameDay } from 'date-fns';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [canReview, setCanReview] = useState(false);
  const [reviewAppointmentId, setReviewAppointmentId] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [ads, setAds] = useState([]);

  useEffect(() => {
    fetchDoctor();
    fetchReviews();
    fetchAds();
    if (isAuthenticated) {
      fetchCanReview();
    }
  }, [doctorId, isAuthenticated]);

  const fetchCanReview = async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await axios.get(`${API_URL}/api/doctors/${doctorId}/can-review`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.can_review) {
        setCanReview(true);
        setReviewAppointmentId(data.appointment_id);
      }
    } catch (error) {
      console.error('Error fetching review eligibility', error);
    }
  };

  const fetchAds = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/campaigns?placement=clinic`);
      setAds(response.data.ads || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const handleAdClick = async (ad) => {
    try {
      await axios.post(`${API_URL}/api/campaigns/${ad.id}/click`);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
    if (ad.redirect_url) window.open(ad.redirect_url, '_blank');
  };

  const fetchDoctor = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/doctors/${doctorId}`);
      setDoctor(response.data);
    } catch (error) {
      console.error('Error fetching doctor:', error);
      toast.error('Doctor not found');
      navigate('/doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/doctors/${doctorId}/reviews`);
      setReviews(response.data.reviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewFormData.rating) return;
    setSubmittingReview(true);
    try {
      await axios.post(
        `${API_URL}/api/doctors/${doctorId}/reviews`,
        {
          doctor_id: doctorId,
          appointment_id: reviewAppointmentId,
          rating: reviewFormData.rating,
          comment: reviewFormData.comment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      setCanReview(false);
      fetchReviews();
      fetchDoctor(); // Updates the average rating overhead
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      toast.info('Please login to book an appointment');
      navigate('/login', { state: { from: { pathname: `/booking/${doctorId}` } } });
      return;
    }
    navigate(`/booking/${doctorId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-64 w-full mb-8 rounded-2xl" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <Skeleton className="h-80 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!doctor) return null;

  return (
    <div className="min-h-screen bg-background" data-testid="doctor-profile">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        {/* Hero Section */}
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary/10 to-primary/5 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden bg-white shadow-lg flex-shrink-0">
              {doctor.profile_image ? (
                <img
                  src={doctor.profile_image}
                  alt={doctor.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <span className="text-5xl font-bold text-primary">
                    {doctor.full_name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{doctor.title} {doctor.full_name}</h1>
                {doctor.is_verified && (
                  <Badge className="bg-green-500 gap-1">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </Badge>
                )}
              </div>

              <p className="text-lg text-muted-foreground mb-4">
                {doctor.specialties?.join(', ') || 'General Medicine'}
              </p>

              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{doctor.rating?.toFixed(1) || '5.0'}</span>
                  <span className="text-muted-foreground">({doctor.review_count || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  {doctor.years_experience || 0}+ years
                </div>
                {doctor.clinic_address && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-5 h-5" />
                    {doctor.clinic_address}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {doctor.consultation_types?.map(type => (
                  <Badge key={type} variant="secondary" className="gap-1">
                    {type === 'home_visit' ? <Home className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    {type === 'home_visit' ? 'Home Visit' : 'In-person'}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="w-full md:w-auto">
              <Card className="border-border/50 shadow-lg">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-primary mb-1">₹{doctor.consultation_fee || 0}</p>
                  <p className="text-sm text-muted-foreground mb-4">per consultation</p>
                  <Button
                    size="lg"
                    className="w-full rounded-full"
                    onClick={handleBooking}
                    data-testid="book-appointment-btn"
                  >
                    Book Appointment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                {/* Bio */}
                {doctor.bio && (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg">About</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{doctor.bio}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Qualifications */}
                {doctor.qualifications?.length > 0 && (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary" />
                        Qualifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {doctor.qualifications.map((qual, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            {qual}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Languages & Insurance */}
                <div className="grid md:grid-cols-2 gap-6">
                  {doctor.languages?.length > 0 && (
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Languages className="w-5 h-5 text-primary" />
                          Languages
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {doctor.languages.map(lang => (
                            <Badge key={lang} variant="secondary">{lang}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {doctor.accepted_insurances?.length > 0 && (
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="w-5 h-5 text-primary" />
                          Accepted Insurance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {doctor.accepted_insurances.map(ins => (
                            <Badge key={ins} variant="secondary">{ins}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Clinic Location Map */}
                {doctor.clinic_address && (
                  <Card className="border-border/50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Location Map
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full h-64 rounded-xl overflow-hidden shadow-sm border border-border">
                        <iframe
                          title="Clinic Location"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          src={`https://www.google.com/maps?q=${encodeURIComponent(doctor.clinic_address)}&output=embed`}
                        ></iframe>
                      </div>
                      <p className="mt-4 text-sm text-muted-foreground break-words">{doctor.clinic_address}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="reviews">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Patient Reviews</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                        <span>{doctor.rating?.toFixed(1) || '5.0'}</span>
                        <span className="text-muted-foreground font-normal">({doctor.review_count || 0})</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {canReview && !showReviewForm && (
                      <div className="mb-6 pb-6 border-b border-border/50">
                        <div className="bg-primary/5 p-4 rounded-xl flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-primary">How was your experience?</h4>
                            <p className="text-sm text-muted-foreground mt-1">Leave a review to help other patients make informed decisions.</p>
                          </div>
                          <Button onClick={() => setShowReviewForm(true)}>Write a Review</Button>
                        </div>
                      </div>
                    )}

                    {showReviewForm && (
                      <div className="mb-8 p-6 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                        <h4 className="font-semibold">Write a Review</h4>
                        <div>
                          <p className="text-sm font-medium mb-2">Overall Rating</p>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setReviewFormData({ ...reviewFormData, rating: star })}
                                className="focus:outline-none hover:scale-110 transition-transform"
                              >
                                <Star
                                  className={`w-8 h-8 ${star <= reviewFormData.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">Detailed Feedback (Optional)</p>
                          <Textarea
                            placeholder="Tell us about your consultation..."
                            className="bg-background min-h-[100px]"
                            value={reviewFormData.comment}
                            onChange={(e) => setReviewFormData({ ...reviewFormData, comment: e.target.value })}
                          />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <Button onClick={handleSubmitReview} disabled={submittingReview}>
                            {submittingReview ? 'Submitting...' : 'Submit Review'}
                          </Button>
                          <Button variant="ghost" onClick={() => setShowReviewForm(false)} disabled={submittingReview}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review.id} className="p-4 rounded-xl bg-muted/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{review.patient_name || 'Patient'}</span>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.comment && (
                              <p className="text-muted-foreground">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No reviews yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="availability">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Check Availability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => {
                        // Block past dates
                        if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;

                        // Block holidays explicitly
                        if (doctor.holidays?.some(h => isSameDay(date, parseISO(h)))) return true;

                        // Block inactive regular service days based on standard schema
                        if (doctor.working_hours) {
                          const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                          const dayName = daysOfWeek[date.getDay()];
                          const daySchedule = doctor.working_hours[dayName];
                          if (daySchedule && !daySchedule.active) return true;
                        }

                        return false;
                      }}
                      className="rounded-md border shadow-sm w-fit mx-auto"
                    />
                    <Button
                      className="w-full mt-4 rounded-full"
                      onClick={handleBooking}
                    >
                      Book for {format(selectedDate, 'MMM d, yyyy')}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Clinic Info */}
            {doctor.clinic_name && (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Clinic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="font-medium">{doctor.clinic_name}</p>
                  {doctor.clinic_address && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span>{doctor.clinic_address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Info */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {doctor.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{doctor.phone}</span>
                  </div>
                )}
                {doctor.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{doctor.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ads Panel */}
            {ads.length > 0 && (
              <div className="space-y-4">
                {ads.map((ad, idx) => (
                  <Card key={idx} className="border-primary/20 bg-primary/5 cursor-pointer hover:shadow-lg transition-all" onClick={() => handleAdClick(ad)}>
                    <img src={ad.image_url} alt={ad.title} className="w-full h-32 object-cover rounded-t-lg" />
                    <CardContent className="p-4 text-center">
                      <Badge variant="secondary" className="mb-2">Sponsored</Badge>
                      <h3 className="font-semibold text-sm line-clamp-2 leading-tight">{ad.title}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* CTA */}
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-6 text-center">
                <h3 className="font-semibold mb-2">Ready to Book?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Schedule your appointment with {doctor.title} {doctor.full_name} today
                </p>
                <Button
                  className="w-full rounded-full"
                  onClick={handleBooking}
                >
                  Book Now - ₹{doctor.consultation_fee || 0}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
