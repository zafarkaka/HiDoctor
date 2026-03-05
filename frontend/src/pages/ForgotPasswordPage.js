import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Stethoscope, Loader2, ArrowLeft, Mail, KeyRound, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1=email, 2=code+newPassword, 3=success
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRequestCode = async (e) => {
        e.preventDefault();
        if (!email) { toast.error('Please enter your email'); return; }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
            toast.success('Reset code generated! Check the console or your email.');
            // For development: show the code if returned
            if (res.data.code) {
                toast.info(`Your reset code: ${res.data.code}`, { duration: 30000 });
            }
            setStep(2);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!code || !newPassword) { toast.error('Please fill in all fields'); return; }
        if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/auth/reset-password`, {
                email,
                code,
                new_password: newPassword,
            });
            setStep(3);
            toast.success('Password reset successfully!');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Invalid or expired code');
        } finally {
            setLoading(false);
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
                                {step === 3 ? 'Password Reset!' : step === 2 ? 'Enter Reset Code' : 'Forgot Password'}
                            </CardTitle>
                            <CardDescription>
                                {step === 3
                                    ? 'Your password has been changed successfully.'
                                    : step === 2
                                        ? 'Enter the 6-digit code and your new password.'
                                        : 'Enter your email to receive a password reset code.'}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {step === 1 && (
                            <form onSubmit={handleRequestCode} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                                    {loading ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                                    ) : (
                                        'Send Reset Code'
                                    )}
                                </Button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">6-Digit Code</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        placeholder="123456"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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
                                <Button type="submit" className="w-full rounded-full" disabled={loading}>
                                    {loading ? (
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
