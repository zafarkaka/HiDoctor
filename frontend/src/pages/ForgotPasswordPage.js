import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Stethoscope, Loader2, ArrowLeft, Mail, KeyRound, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { auth } from '../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1=phone, 2=otp+newPassword, 3=success
    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [otp, setOtp] = useState('');
    const [verificationId, setVerificationId] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    useEffect(() => {
        // We clean up any existing verifier on mount to ensure a fresh start
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                console.warn('Error clearing verifier:', e);
            }
            window.recaptchaVerifier = null;
        }

        const initVerifier = () => {
            const container = document.getElementById('recaptcha-container');
            if (container && !window.recaptchaVerifier) {
                try {
                    console.log('Initializing RecaptchaVerifier for ForgotPassword...');
                    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                        'size': 'invisible',
                    });
                } catch (e) {
                    console.error('Error initializing ReCAPTCHA:', e);
                }
            }
        };

        initVerifier();

        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) {
                    console.warn('Error clearing verifier on unmount:', e);
                }
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    const handleRequestCode = async (e) => {
        e.preventDefault();
        if (!phone) { toast.error('Please enter your phone number'); return; }

        setLoading(true);
        try {
            const fullPhone = countryCode + phone.replace(/\D/g, '');
            // First check if phone exists in our DB
            await axios.post(`${API_URL}/api/auth/forgot-password`, { phone: fullPhone });
            
            // If exists, send Firebase OTP
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
            }

            const confirmationResult = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
            setVerificationId(confirmationResult);
            
            toast.success('OTP sent to your phone!');
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to send OTP. Ensure phone number is registered.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!otp || !newPassword) { toast.error('Please fill in all fields'); return; }
        if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

        setVerifyingOtp(true);
        try {
            // Verify OTP
            const result = await verificationId.confirm(otp);
            const firebaseToken = await result.user.getIdToken();

            const fullPhone = countryCode + phone.replace(/\D/g, '');
            // Update password on backend
            await axios.post(`${API_URL}/api/auth/reset-password`, {
                phone: fullPhone,
                firebase_token: firebaseToken,
                new_password: newPassword,
            });
            setStep(3);
            toast.success('Password reset successfully!');
        } catch (error) {
            console.error('Reset Error:', error);
            toast.error(error.response?.data?.detail || 'Invalid or expired OTP');
        } finally {
            setVerifyingOtp(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="p-4">
                <Button variant="ghost" onClick={() => navigate('/login')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                </Button>
            </div>

            <div className="flex-1 flex items-center justify-center px-4 py-8">
                <Card className="w-full max-w-md border-border/50 shadow-xl">
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
                            {step === 3 ? (
                                <CheckCircle className="w-7 h-7 text-white" />
                            ) : step === 2 ? (
                                <KeyRound className="w-7 h-7 text-white" />
                            ) : (
                                <Mail className="w-7 h-7 text-white" />
                            )}
                        </div>
                        <div>
                            <CardTitle className="text-2xl">
                                {step === 3 ? 'Password Reset!' : step === 2 ? 'Verify & Reset' : 'Forgot Password'}
                            </CardTitle>
                            <CardDescription>
                                {step === 3
                                    ? 'Your password has been changed successfully.'
                                    : step === 2
                                        ? 'Enter the 6-digit OTP sent to your phone.'
                                        : 'Enter your phone number to reset password.'}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {step === 1 && (
                            <form onSubmit={handleRequestCode} className="space-y-4">
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
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                            required
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP...</>
                                    ) : (
                                        'Send Verification Code'
                                    )}
                                </Button>
                                <div id="recaptcha-container"></div>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="otp">6-Digit OTP</Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        className="text-center text-2xl tracking-[0.5em] font-mono"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        placeholder="At least 6 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Re-enter your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full rounded-full" disabled={verifyingOtp}>
                                    {verifyingOtp ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resetting...</>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => setStep(1)}
                                >
                                    Resend Code
                                </Button>
                            </form>
                        )}

                        {step === 3 && (
                            <div className="text-center space-y-4">
                                <p className="text-muted-foreground">You can now sign in with your new password.</p>
                                <Button className="w-full rounded-full" onClick={() => navigate('/login')}>
                                    Go to Login
                                </Button>
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <p className="text-muted-foreground">
                                Remember your password?{' '}
                                <Link to="/login" className="text-primary font-medium hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                        <div id="recaptcha-container"></div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
