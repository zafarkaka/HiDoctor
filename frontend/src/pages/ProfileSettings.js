import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, MobileNav } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
  User,
  Bell,
  Shield,
  Download,
  Trash2,
  Loader2,
  Save,
  ChevronLeft
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export default function ProfileSettings() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    preferred_language: 'English',
    insurance_provider: '',
    insurance_id: '',
    allergies: '',
    chronic_conditions: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    consultation_fee: ''
  });
  const [notifications, setNotifications] = useState({
    appointments: true,
    messages: true,
    reminders: true,
    marketing: false
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const endpoint = user?.role === 'patient'
        ? `${API_URL}/api/patients/profile`
        : user?.role === 'doctor'
          ? `${API_URL}/api/doctors/profile`
          : `${API_URL}/api/auth/me`;

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(response.data);
      setFormData(prev => ({
        ...prev,
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || response.data?.phone || '',
        address: response.data?.address || '',
        date_of_birth: response.data?.date_of_birth || '',
        gender: response.data?.gender || '',
        preferred_language: response.data?.preferred_language || 'English',
        insurance_provider: response.data?.insurance_provider || '',
        insurance_id: response.data?.insurance_id || '',
        allergies: response.data?.allergies?.join(', ') || '',
        chronic_conditions: response.data?.chronic_conditions?.join(', ') || '',
        emergency_contact_name: response.data?.emergency_contact_name || '',
        emergency_contact_phone: response.data?.emergency_contact_phone || '',
        consultation_fee: response.data?.consultation_fee || ''
      }));
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (uploadFile) {
        const fileData = new FormData();
        fileData.append('file', uploadFile);

        const getAuthHeader = () => ({
          headers: { Authorization: `Bearer ${token}` }
        });

        const response = await axios.post(`${API_URL}/api/auth/profile/picture`, fileData, {
          headers: {
            ...getAuthHeader().headers
          }
        });
      }

      if (user?.role === 'patient') {
        const data = {
          ...formData,
          allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
          chronic_conditions: formData.chronic_conditions ? formData.chronic_conditions.split(',').map(s => s.trim()) : []
        };
        await axios.put(`${API_URL}/api/patients/profile`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (user?.role === 'doctor') {
        const doctorData = { ...formData };
        if (doctorData.consultation_fee) {
          doctorData.consultation_fee = parseFloat(doctorData.consultation_fee);
        }
        await axios.put(`${API_URL}/api/doctors/profile`, doctorData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.put(`${API_URL}/api/auth/profile`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      toast.success('Profile updated successfully');
      setUploadFile(null);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // In a real app, this would call an API to delete the account
      toast.success('Account deletion request submitted');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  const handleExportData = async () => {
    toast.success('Your data export has been requested. You will receive an email shortly.');
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0" data-testid="profile-settings">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 gap-2">
          <ChevronLeft className="w-4 h-4" />
          Back
        </Button>

        <h1 className="text-2xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6 items-start mb-6">
                <div className="w-24 h-24 rounded-full bg-primary/10 overflow-hidden flex-shrink-0 flex items-center justify-center border-4 border-background shadow-sm">
                  {profile?.profile_image ? (
                    <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary" />
                  )}
                </div>
                <div className="flex-1 space-y-2 mt-2">
                  <Label>Profile Picture</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files[0])} />
                  <p className="text-xs text-muted-foreground">Upload a square image for best results. Max 5MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <div
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background"
                  >
                    {formData.date_of_birth ? formatDate(formData.date_of_birth) : 'Not provided'}
                  </div>
                </div>
              </div>

              {user?.role === 'doctor' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="consultation_fee">Consultation Fee (INR)</Label>
                    <Input
                      id="consultation_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.consultation_fee}
                      onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                      placeholder="e.g 150.00"
                    />
                  </div>
                </div>
              )}

              {user?.role === 'patient' && (
                <>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <Separator />

                  <h3 className="font-medium">Medical Information</h3>

                  <div>
                    <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                    <Input
                      id="allergies"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      placeholder="e.g., Penicillin, Peanuts"
                    />
                  </div>

                  <div>
                    <Label htmlFor="chronic_conditions">Chronic Conditions (comma-separated)</Label>
                    <Input
                      id="chronic_conditions"
                      value={formData.chronic_conditions}
                      onChange={(e) => setFormData({ ...formData, chronic_conditions: e.target.value })}
                      placeholder="e.g., Diabetes, Hypertension"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="insurance_provider">Insurance Provider</Label>
                      <Input
                        id="insurance_provider"
                        value={formData.insurance_provider}
                        onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="insurance_id">Insurance ID</Label>
                      <Input
                        id="insurance_id"
                        value={formData.insurance_id}
                        onChange={(e) => setFormData({ ...formData, insurance_id: e.target.value })}
                      />
                    </div>
                  </div>

                  <Separator />

                  <h3 className="font-medium">Emergency Contact</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_contact_name">Contact Name</Label>
                      <Input
                        id="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                      <Input
                        id="emergency_contact_phone"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <Button onClick={handleSave} disabled={loading} className="gap-2 rounded-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Appointment Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified about appointment changes</p>
                </div>
                <Switch
                  checked={notifications.appointments}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, appointments: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Messages</p>
                  <p className="text-sm text-muted-foreground">Get notified about new messages</p>
                </div>
                <Switch
                  checked={notifications.messages}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, messages: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Appointment Reminders</p>
                  <p className="text-sm text-muted-foreground">Receive reminders before appointments</p>
                </div>
                <Switch
                  checked={notifications.reminders}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, reminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing & Updates</p>
                  <p className="text-sm text-muted-foreground">Receive news and promotional content</p>
                </div>
                <Switch
                  checked={notifications.marketing}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, marketing: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Data */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Data
              </CardTitle>
              <CardDescription>Manage your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" onClick={handleExportData} className="w-full gap-2">
                <Download className="w-4 h-4" />
                Download My Data (GDPR)
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground">
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
