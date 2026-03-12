import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Stethoscope, Loader2, ArrowLeft, User, UserCog, Camera, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { auth } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient'
  });
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState('');
  const [verificationId, setVerificationId] = useState(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    const container = document.getElementById('recaptcha-container');
    if (container && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendOtp = async () => {
    if (!formData.phone) {
      toast.error('Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      const fullPhone = countryCode + formData.phone.replace(/\D/g, '');
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
      setVerificationId(confirmationResult);
      setShowOtpInput(true);
      toast.success('OTP sent to your phone!');
    } catch (err) {
      console.error('OTP Error:', err);
      toast.error('Failed to send OTP. Please check your phone number format (e.g. +1234567890)');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndSubmit = async (e) => {
    e.preventDefault();

    if (!verificationId) {
      toast.error('Please send OTP first');
      return;
    }

    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setVerifyingOtp(true);
    try {
      const result = await verificationId.confirm(otp);
      const firebaseToken = await result.user.getIdToken();
      
      await handleFinalSubmit(firebaseToken);
    } catch (err) {
      console.error('Verification Error:', err);
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleFinalSubmit = async (firebaseToken) => {
    setLoading(true);

    try {
      const fullPhone = countryCode + formData.phone.replace(/\D/g, '');
      const user = await register({
        full_name: formData.full_name,
        username: formData.username,
        phone: fullPhone,
        password: formData.password,
        role: formData.role,
        firebase_token: firebaseToken
      });

      // If doctor, upload profile picture
      if (formData.role === 'doctor' && profilePic) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', profilePic);
        const token = localStorage.getItem('token');

        await axios.post(`${API_URL}/api/auth/profile/picture`, uploadFormData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }

      toast.success('Account created successfully!');

      // Redirect based on role
      if (user.role === 'doctor') {
        navigate('/doctor/onboarding');
      } else {
        navigate('/patient');
      }
    } catch (err) {
      console.error('Registration error:', err);
      const detail = err.response?.data?.detail;
      let errorMessage = 'Registration failed. Please try again.';

      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map(e => e.msg).join(', ');
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-border/50 shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>Join HiDoctor today</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-3">
                <Label>I am a</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  className="grid grid-cols-2 gap-4"
                >
                  <Label
                    htmlFor="patient"
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.role === 'patient'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <RadioGroupItem value="patient" id="patient" className="sr-only" />
                    <User className={`w-8 h-8 ${formData.role === 'patient' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-medium ${formData.role === 'patient' ? 'text-primary' : ''}`}>Patient</span>
                  </Label>
                  <Label
                    htmlFor="doctor"
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.role === 'doctor'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                      }`}
                  >
                    <RadioGroupItem value="doctor" id="doctor" className="sr-only" />
                    <UserCog className={`w-8 h-8 ${formData.role === 'doctor' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-medium ${formData.role === 'doctor' ? 'text-primary' : ''}`}>Doctor</span>
                  </Label>
                </RadioGroup>
              </div>

              {/* Profile Picture Upload for Doctors */}
              {formData.role === 'doctor' && (
                <div className="space-y-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <Label className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary" />
                    Profile Picture * <span className="text-xs font-normal text-muted-foreground">(Mandatory)</span>
                  </Label>

                  <div className="flex flex-col items-center gap-4">
                    {previewUrl ? (
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary shadow-md">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setProfilePic(null); setPreviewUrl(null); }}
                          className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:bg-primary/10 transition-colors">
                          <Upload className="w-8 h-8 text-primary/60 mb-2" />
                          <span className="text-sm text-primary font-medium">Click to upload photo</span>
                          <span className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setProfilePic(file);
                                setPreviewUrl(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  data-testid="register-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue placeholder="Code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+91">🇮🇳 +91</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      <SelectItem value="+61">🇦🇺 +61</SelectItem>
                      <SelectItem value="+971">🇦🇪 +971</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="98949..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    required
                    data-testid="register-phone"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  data-testid="register-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  data-testid="register-confirm-password"
                />
              </div>

              {!showOtpInput ? (
                <Button
                  type="button"
                  className="w-full rounded-full"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Verify Phone & Continue'
                  )}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter 6-digit OTP</Label>
                    <Input
                      id="otp"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                      required
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full rounded-full"
                    onClick={handleVerifyAndSubmit}
                    disabled={verifyingOtp || loading}
                  >
                    {verifyingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Create Account'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-xs"
                    onClick={() => setShowOtpInput(false)}
                  >
                    Change Phone Number
                  </Button>
                </div>
              )}
              <div id="recaptcha-container"></div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>

            <p className="mt-4 text-xs text-center text-muted-foreground">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
