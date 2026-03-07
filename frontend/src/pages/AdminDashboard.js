import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Users, Calendar, IndianRupee, Clock,
  CheckCircle, XCircle, Search, Eye, MousePointer,
  FileText, Megaphone, Shield, Plus, Trash2,
  MoreHorizontal, UserCheck, UserX, CreditCard,
  Sparkles, X, Edit, Stethoscope, UserPlus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminDashboard() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdModal, setShowAdModal] = useState(false);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSingleDocModal, setShowSingleDocModal] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [blogForm, setBlogForm] = useState({ title: '', content: '', excerpt: '', category: 'Health Tips', tags: '', is_published: true });
  const [adForm, setAdForm] = useState({ title: '', image_url: '', redirect_url: '', placement: 'home', start_date: '', end_date: '' });
  const [doctorForm, setDoctorForm] = useState({ bio: '', specialties: '', clinic_name: '', consultation_fee: 0, profile_picture: '', is_verified: false, is_active: false });
  const [singleDocForm, setSingleDocForm] = useState({ full_name: '', email: '', password: 'password123', specialties: '', years_experience: 0, clinic_name: 'HiDoctor Default', clinic_address: 'Main St, City', consultation_fee: 0, bio: '', title: 'Dr.' });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      const [analyticsRes, doctorsRes, usersRes, appointmentsRes, blogsRes, adsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/analytics`, { headers }),
        axios.get(`${API_URL}/api/admin/doctors/pending`, { headers }),
        axios.get(`${API_URL}/api/admin/users`, { headers }),
        axios.get(`${API_URL}/api/admin/appointments`, { headers }),
        axios.get(`${API_URL}/api/admin/blog`, { headers }),
        axios.get(`${API_URL}/api/admin/campaigns`, { headers })
      ]);
      setAnalytics(analyticsRes.data);
      setPendingDoctors(doctorsRes.data.doctors);
      setUsers(usersRes.data.users);
      setAppointments(appointmentsRes.data.appointments);
      setBlogs(blogsRes.data.posts);
      setAds(adsRes.data.ads);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDoctor = async (doctorId) => {
    try {
      await axios.post(`${API_URL}/api/admin/doctors/${doctorId}/verify`, {}, { headers });
      toast.success('Doctor verified successfully');
      fetchAllData();
    } catch (error) { toast.error('Failed to verify doctor'); }
  };

  const handleRejectDoctor = async (doctorId) => {
    if (!window.confirm('Reject this doctor?')) return;
    try {
      await axios.post(`${API_URL}/api/admin/doctors/${doctorId}/reject`, {}, { headers });
      toast.success('Doctor rejected');
      fetchAllData();
    } catch (error) { toast.error('Failed to reject doctor'); }
  };

  const handleSuspendUser = async (userId) => {
    if (!window.confirm('Suspend this user?')) return;
    try {
      await axios.post(`${API_URL}/api/admin/users/${userId}/suspend`, {}, { headers });
      toast.success('User suspended');
      fetchAllData();
    } catch (error) { toast.error('Failed to suspend user'); }
  };

  const handleUnsuspendUser = async (userId) => {
    try {
      await axios.post(`${API_URL}/api/admin/users/${userId}/unsuspend`, {}, { headers });
      toast.success('User unsuspended');
      fetchAllData();
    } catch (error) { toast.error('Failed to unsuspend user'); }
  };

  const handleEditDoctorConfig = (doctor) => {
    setEditingDoctor(doctor);
    setDoctorForm({
      bio: doctor.bio || '',
      specialties: doctor.specialties?.join(', ') || '',
      clinic_name: doctor.clinic_name || '',
      clinic_address: doctor.clinic_address || '',
      consultation_fee: doctor.consultation_fee || 0,
      years_experience: doctor.years_experience || 0,
      title: doctor.title || 'Dr.',
      license_number: doctor.license_number || '',
      profile_picture: doctor.profile_image || doctor.profile_picture || '',
      is_verified: doctor.is_verified || false,
      is_active: doctor.is_active || false
    });
    setShowDoctorModal(true);
  };

  const handleSaveDoctorConfig = async (e) => {
    e.preventDefault();
    if (!editingDoctor) return;

    try {
      // 1. Upload Profile Picture if provided
      if (uploadFile) {
        const formData = new FormData();
        formData.append('file', uploadFile);

        await axios.post(`${API_URL}/api/admin/doctors/${editingDoctor.id}/profile-picture`, formData, {
          headers: { ...getAuthHeader().headers }
        });
      }

      // 2. Default String Overrides
      const payload = {
        ...doctorForm,
        specialties: doctorForm.specialties.split(',').map(s => s.trim()).filter(s => s !== ''),
        consultation_fee: Number(doctorForm.consultation_fee),
        years_experience: Number(doctorForm.years_experience)
      };

      await axios.put(`${API_URL}/api/admin/doctors/${editingDoctor.id}`, payload, { headers });
      toast.success('Doctor profile forcefully updated');
      setShowDoctorModal(false);
      setEditingDoctor(null);
      setUploadFile(null);
      fetchAllData();
    } catch (error) { toast.error('Failed to update doctor profile'); }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkText.trim()) return;
    try {
      const response = await axios.post(`${API_URL}/api/admin/doctors/bulk-upload`, { data: bulkText }, { headers });
      toast.success(response.data.message || 'Doctors bulk imported');
      setShowBulkModal(false);
      setBulkText("");
      fetchAllData();
    } catch (error) { toast.error('Failed to parse or upload doctors'); }
  };

  const handleCreateSingleDoctor = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...singleDocForm,
        specialties: singleDocForm.specialties.split(',').map(s => s.trim()).filter(Boolean),
        years_experience: Number(singleDocForm.years_experience),
        consultation_fee: Number(singleDocForm.consultation_fee)
      };
      await axios.post(`${API_URL}/api/admin/doctors`, payload, { headers });
      toast.success('Doctor created successfully');
      setShowSingleDocModal(false);
      setSingleDocForm({ full_name: '', email: '', password: 'password123', specialties: '', years_experience: 0, clinic_name: 'HiDoctor Default', clinic_address: 'Main St, City', consultation_fee: 0, bio: '', title: 'Dr.' });
      fetchAllData();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to create doctor'); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/users/${userId}`, { headers });
      toast.success('User deleted');
      fetchAllData();
    } catch (error) { toast.error(error.response?.data?.detail || 'Failed to delete user'); }
  };

  const handleChangeRole = async (userId, newRole) => {
    try {
      await axios.put(`${API_URL}/api/admin/users/${userId}/role`, { role: newRole }, { headers });
      toast.success(`Role changed to ${newRole}`);
      fetchAllData();
    } catch (error) { toast.error('Failed to change role'); }
  };

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/blog`, {
        ...blogForm,
        tags: blogForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      }, { headers });
      toast.success('Blog post created!');
      setShowBlogModal(false);
      setBlogForm({ title: '', content: '', excerpt: '', category: 'Health Tips', tags: '', is_published: true });
      fetchAllData();
    } catch (error) { toast.error('Failed to create blog post'); }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/admin/campaigns`, adForm, { headers });
      toast.success('Ad created!');
      setShowAdModal(false);
      setAdForm({ title: '', image_url: '', redirect_url: '', placement: 'home', start_date: '', end_date: '' });
      fetchAllData();
    } catch (error) { toast.error('Failed to create ad'); }
  };

  const handleDeleteAd = async (adId) => {
    if (!window.confirm('Delete this ad?')) return;
    try {
      await axios.delete(`${API_URL}/api/admin/campaigns/${adId}`, { headers });
      toast.success('Ad deleted');
      fetchAllData();
    } catch (error) { toast.error('Failed to delete ad'); }
  };

  const handleDeleteBlog = async (postId) => {
    if (!window.confirm('Delete this blog post?')) return;
    try {
      await axios.delete(`${API_URL}/api/blog/${postId}`, { headers });
      toast.success('Blog post deleted');
      fetchAllData();
    } catch (error) { toast.error('Failed to delete blog post'); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your HiDoctor platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics?.users?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics?.appointments?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Appointments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">₹{analytics?.revenue || 0}</p>
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analytics?.users?.pending_doctors || 0}</p>
                  <p className="text-sm text-muted-foreground">Pending Doctors</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="verification" className="gap-1">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Verify</span>
              {pendingDoctors.length > 0 && <Badge className="bg-amber-500 ml-1">{pendingDoctors.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="doctors" className="gap-1">
              <Stethoscope className="w-4 h-4" />
              <span className="hidden sm:inline">Doctors</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="appointments" className="gap-1">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Appts</span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-1">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Blog</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="gap-1">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Ads</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Subs</span>
            </TabsTrigger>
          </TabsList>

          {/* Verification Queue */}
          <TabsContent value="verification">
            <Card className="border-border/50">
              <CardHeader><CardTitle>Doctor Verification Queue</CardTitle></CardHeader>
              <CardContent>
                {pendingDoctors.length > 0 ? (
                  <div className="space-y-4">
                    {pendingDoctors.map((doctor) => (
                      <div key={doctor.user_id} className="flex items-start gap-4 p-4 rounded-xl bg-muted/50">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl font-bold text-primary">{doctor.full_name?.charAt(0) || 'D'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{doctor.title} {doctor.full_name}</h3>
                          <p className="text-sm text-muted-foreground">License: {doctor.license_number}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doctor.specialties?.map((spec, i) => (
                              <Badge key={i} variant="secondary">{spec}</Badge>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {doctor.years_experience} yrs exp • ₹{doctor.consultation_fee}/visit • {doctor.affiliation_type || 'clinic'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleVerifyDoctor(doctor.user_id)} className="rounded-full">
                            <CheckCircle className="w-4 h-4 mr-1" /> Verify
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRejectDoctor(doctor.user_id)} className="rounded-full text-destructive">
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground">No pending verifications</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verified Doctors Tab */}
          <TabsContent value="doctors">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Doctor Management</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search doctors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowBulkModal(true)} variant="secondary" className="gap-2">
                      <Plus className="w-4 h-4" /> Bulk Upload
                    </Button>
                    <Button onClick={() => setShowSingleDocModal(true)} variant="default" className="gap-2">
                      <UserPlus className="w-4 h-4" /> Add Doctor
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users
                    .filter(u => u.role === 'doctor')
                    .filter(u => u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-medium text-primary">{user.full_name?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">Doctor</Badge>
                          {user.is_suspended && <Badge variant="destructive">Suspended</Badge>}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditDoctorConfig(user)}>
                                <Edit className="w-4 h-4 mr-2" /> Edit Profile (Force)
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.is_suspended ? (
                                <DropdownMenuItem onClick={() => handleUnsuspendUser(user.id)}>
                                  <UserCheck className="w-4 h-4 mr-2" /> Unsuspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleSuspendUser(user.id)} className="text-amber-600">
                                  <UserX className="w-4 h-4 mr-2" /> Suspend
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {['patient', 'admin'].filter(r => r !== user.role).map(role => (
                                <DropdownMenuItem key={role} onClick={() => handleChangeRole(user.id, role)}>
                                  Change to {role.charAt(0).toUpperCase() + role.slice(1)}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Doctor
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patients with More Options */}
          <TabsContent value="users">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Patient Management</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users
                    .filter(u => u.role === 'patient')
                    .filter(u => u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-medium text-primary">{user.full_name?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{user.role}</Badge>
                          {user.is_suspended && <Badge variant="destructive">Suspended</Badge>}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost"><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.is_suspended ? (
                                <DropdownMenuItem onClick={() => handleUnsuspendUser(user.id)}>
                                  <UserCheck className="w-4 h-4 mr-2" /> Unsuspend
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleSuspendUser(user.id)} className="text-amber-600">
                                  <UserX className="w-4 h-4 mr-2" /> Suspend
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {['patient', 'doctor', 'admin'].filter(r => r !== user.role).map(role => (
                                <DropdownMenuItem key={role} onClick={() => handleChangeRole(user.id, role)}>
                                  Change to {role.charAt(0).toUpperCase() + role.slice(1)}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appointments */}
          <TabsContent value="appointments">
            <Card className="border-border/50">
              <CardHeader><CardTitle>All Appointments</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {appointments.slice(0, 20).map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                      <div>
                        <p className="font-medium">{apt.patient?.full_name} → {apt.doctor?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {apt.hex_reference && <span className="font-mono text-primary mr-2">#{apt.hex_reference}</span>}
                          {format(parseISO(apt.appointment_date), 'dd-MM-yyyy')} at {apt.appointment_time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`
                          ${apt.status === 'confirmed' ? 'bg-green-100 text-green-700' : ''}
                          ${apt.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                          ${apt.status === 'completed' ? 'bg-blue-100 text-blue-700' : ''}
                          ${apt.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
                        `}>
                          {apt.status}
                        </Badge>
                        <span className="font-medium">₹{apt.payment_amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blog with Create Modal */}
          <TabsContent value="blog">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Blog Posts</CardTitle>
                <Button onClick={() => setShowBlogModal(true)} className="rounded-full">
                  <Plus className="w-4 h-4 mr-1" /> Add Blog Post
                </Button>
              </CardHeader>
              <CardContent>
                {blogs.length > 0 ? (
                  <div className="space-y-2">
                    {blogs.map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{post.title}</p>
                          <p className="text-sm text-muted-foreground">{post.category} • {post.view_count} views</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={post.is_published ? 'default' : 'secondary'}>
                            {post.is_published ? 'Published' : 'Draft'}
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteBlog(post.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No blog posts yet. Create your first one!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ads with Create Modal */}
          <TabsContent value="ads">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Ad Management</CardTitle>
                <Button onClick={() => setShowAdModal(true)} className="rounded-full">
                  <Plus className="w-4 h-4 mr-1" /> Add New Ad
                </Button>
              </CardHeader>
              <CardContent>
                {ads.length > 0 ? (
                  <div className="space-y-4">
                    {ads.map((ad) => (
                      <div key={ad.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                        <img src={ad.image_url} alt={ad.title} className="w-24 h-16 object-cover rounded-lg" onError={(e) => e.target.src = 'https://placehold.co/200x130?text=Ad'} />
                        <div className="flex-1">
                          <h3 className="font-medium">{ad.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {ad.placement} • {ad.start_date?.slice(0, 10)} to {ad.end_date?.slice(0, 10)}
                          </p>
                          <div className="flex gap-4 mt-1 text-sm">
                            <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {ad.impressions} views</span>
                            <span className="flex items-center gap-1"><MousePointer className="w-4 h-4" /> {ad.clicks} clicks</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={ad.is_active ? 'default' : 'secondary'}>{ad.is_active ? 'Active' : 'Inactive'}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteAd(ad.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No ads created yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions - Coming Soon */}
          <TabsContent value="subscriptions">
            <Card className="border-border/50">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Subscriptions</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Premium subscription plans are coming soon! Offer patients exclusive benefits, priority booking, and unlimited consultations.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {[
                    { name: 'Basic', price: 'Free', features: ['5 appointments/month', 'Chat support'] },
                    { name: 'Premium', price: '₹499/mo', features: ['Unlimited appointments', 'Priority booking', 'Video calls'] },
                    { name: 'Family', price: '₹799/mo', features: ['All Premium features', 'Up to 6 members', 'Health reports'] }
                  ].map(plan => (
                    <div key={plan.name} className="p-4 rounded-xl border border-border bg-muted/30">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      <p className="text-2xl font-bold text-primary my-2">{plan.price}</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {plan.features.map(f => <li key={f}>✓ {f}</li>)}
                      </ul>
                      <Badge className="mt-3 bg-amber-100 text-amber-700">Coming Soon</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Doctor Modal */}
      {showDoctorModal && editingDoctor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Doctor Profile</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowDoctorModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSaveDoctorConfig} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Title</label>
                  <Input value={doctorForm.title} onChange={(e) => setDoctorForm({ ...doctorForm, title: e.target.value })} placeholder="Dr." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Years of Experience</label>
                  <Input type="number" value={doctorForm.years_experience} onChange={(e) => setDoctorForm({ ...doctorForm, years_experience: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Clinic / Hospital Name</label>
                  <Input value={doctorForm.clinic_name} onChange={(e) => setDoctorForm({ ...doctorForm, clinic_name: e.target.value })} placeholder="E.g. Apollo Hospital" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Consultation Fee (₹)</label>
                  <Input type="number" value={doctorForm.consultation_fee} onChange={(e) => setDoctorForm({ ...doctorForm, consultation_fee: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block flex justify-between items-center">
                  Clinic Address
                  {doctorForm.clinic_address && (
                    <button
                      type="button"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doctorForm.clinic_address)}`, '_blank')}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <MousePointer className="w-3 h-3" /> View on Maps (Optional)
                    </button>
                  )}
                </label>
                <Input
                  value={doctorForm.clinic_address}
                  onChange={(e) => setDoctorForm({ ...doctorForm, clinic_address: e.target.value })}
                  placeholder="Street, City, Zip Code"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Specialties (comma separated)</label>
                <Input value={doctorForm.specialties} onChange={(e) => setDoctorForm({ ...doctorForm, specialties: e.target.value })} placeholder="Cardiology, General Physician" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Bio / Summary</label>
                <textarea
                  value={doctorForm.bio}
                  onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Doctor's biography..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Profile Picture URL</label>
                  <Input value={doctorForm.profile_picture} onChange={(e) => setDoctorForm({ ...doctorForm, profile_picture: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Upload Image Override</label>
                  <Input type="file" accept="image/*" onChange={(e) => setUploadFile(e.target.files[0])} />
                </div>
              </div>

              <div className="flex flex-col gap-2 p-4 bg-muted/50 rounded-lg">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <input type="checkbox" checked={doctorForm.is_verified} onChange={(e) => setDoctorForm({ ...doctorForm, is_verified: e.target.checked })} />
                  Verified Profile
                </label>
                <p className="text-xs text-muted-foreground ml-6">Checked means the doctor is fully verified and will show up in search results.</p>

                <label className="text-sm font-semibold flex items-center gap-2 mt-2">
                  <input type="checkbox" checked={doctorForm.is_active} onChange={(e) => setDoctorForm({ ...doctorForm, is_active: e.target.checked })} />
                  Active Status
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setShowDoctorModal(false); setUploadFile(null); }} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1">Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Bulk Create Doctors</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowBulkModal(false)}><X className="w-5 h-5" /></Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Paste your comma-separated list below. Format (10 fields): <strong>Email, Password, Full Name, Title, Specialties (pipe | separated), Experience Years, Fee, Clinic Name, Clinic Address, Bio</strong>
            </p>
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="jdoe@clinic.com, pass123, John Doe, Dr., Cardiology|Surgeon, 10, 500, Apollo, 123 Main St, Experienced heart surgeon.&#10;asmith@clinic.com, secure456, Alice Smith, Dr., Pediatrics, 5, 300, City Health, 456 Oak Ave, Friendly pediatrician."
                className="w-full h-48 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary font-mono whitespace-pre overflow-x-auto"
              ></textarea>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowBulkModal(false)}>Cancel</Button>
                <Button type="submit">Import Data</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Doctor Create Modal */}
      {showSingleDocModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add New Doctor</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowSingleDocModal(false)}><X className="w-5 h-5" /></Button>
            </div>
            <form onSubmit={handleCreateSingleDoctor} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Full Name</label>
                  <Input required value={singleDocForm.full_name} onChange={(e) => setSingleDocForm({ ...singleDocForm, full_name: e.target.value })} placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Title</label>
                  <Input required value={singleDocForm.title} onChange={(e) => setSingleDocForm({ ...singleDocForm, title: e.target.value })} placeholder="Dr." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input type="email" required value={singleDocForm.email} onChange={(e) => setSingleDocForm({ ...singleDocForm, email: e.target.value })} placeholder="doctor@clinic.com" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Password</label>
                  <Input required value={singleDocForm.password} onChange={(e) => setSingleDocForm({ ...singleDocForm, password: e.target.value })} placeholder="password123" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Specialties (comma separated)</label>
                <Input required value={singleDocForm.specialties} onChange={(e) => setSingleDocForm({ ...singleDocForm, specialties: e.target.value })} placeholder="Cardiology, General Physician" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Clinic Name</label>
                  <Input required value={singleDocForm.clinic_name} onChange={(e) => setSingleDocForm({ ...singleDocForm, clinic_name: e.target.value })} placeholder="Apollo Clinic" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Clinic Address</label>
                  <Input required value={singleDocForm.clinic_address} onChange={(e) => setSingleDocForm({ ...singleDocForm, clinic_address: e.target.value })} placeholder="123 Health St, City" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Years of Experience</label>
                  <Input type="number" required value={singleDocForm.years_experience} onChange={(e) => setSingleDocForm({ ...singleDocForm, years_experience: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Consultation Fee (₹)</label>
                  <Input type="number" required value={singleDocForm.consultation_fee} onChange={(e) => setSingleDocForm({ ...singleDocForm, consultation_fee: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Bio</label>
                <textarea
                  value={singleDocForm.bio}
                  onChange={(e) => setSingleDocForm({ ...singleDocForm, bio: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Experienced specialist..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowSingleDocModal(false)}>Cancel</Button>
                <Button type="submit">Create Doctor</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blog Create Modal */}
      {showBlogModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create Blog Post</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowBlogModal(false)}><X className="w-5 h-5" /></Button>
            </div>
            <form onSubmit={handleCreateBlog} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <Input value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} required placeholder="Blog post title" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Content *</label>
                <textarea
                  value={blogForm.content}
                  onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                  required
                  placeholder="Write your blog content here..."
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[150px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Excerpt</label>
                <Input value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} placeholder="Short summary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <select
                    value={blogForm.category}
                    onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary"
                  >
                    {['Health Tips', 'Wellness', 'Nutrition', 'Mental Health', 'Fitness', 'Medical News', 'Disease Prevention'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tags (comma separated)</label>
                  <Input value={blogForm.tags} onChange={(e) => setBlogForm({ ...blogForm, tags: e.target.value })} placeholder="health, wellness" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={blogForm.is_published} onChange={(e) => setBlogForm({ ...blogForm, is_published: e.target.checked })} id="publish" />
                <label htmlFor="publish" className="text-sm">Publish immediately</label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowBlogModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1">Create Post</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ad Create Modal */}
      {showAdModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create New Ad</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAdModal(false)}><X className="w-5 h-5" /></Button>
            </div>
            <form onSubmit={handleCreateAd} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <Input value={adForm.title} onChange={(e) => setAdForm({ ...adForm, title: e.target.value })} required placeholder="Ad title" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Image URL *</label>
                <Input value={adForm.image_url} onChange={(e) => setAdForm({ ...adForm, image_url: e.target.value })} required placeholder="https://example.com/ad-image.jpg" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Redirect URL *</label>
                <Input value={adForm.redirect_url} onChange={(e) => setAdForm({ ...adForm, redirect_url: e.target.value })} required placeholder="https://example.com/landing" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Placement</label>
                  <select
                    value={adForm.placement}
                    onChange={(e) => setAdForm({ ...adForm, placement: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                  >
                    {['home', 'clinic', 'blog'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Start Date *</label>
                  <Input type="date" value={adForm.start_date} onChange={(e) => setAdForm({ ...adForm, start_date: e.target.value })} required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">End Date *</label>
                  <Input type="date" value={adForm.end_date} onChange={(e) => setAdForm({ ...adForm, end_date: e.target.value })} required />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAdModal(false)} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1">Create Ad</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
