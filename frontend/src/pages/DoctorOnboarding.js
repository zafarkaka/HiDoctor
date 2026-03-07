import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader2,
  Stethoscope,
  Award,
  Building,
  DollarSign,
  Camera,
  Upload,
  User
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Stethoscope },
  { id: 2, title: 'Qualifications', icon: Award },
  { id: 3, title: 'Practice', icon: Building },
  { id: 4, title: 'Pricing', icon: DollarSign }
];

const SPECIALTIES = [
  'General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics',
  'Orthopedics', 'Gynecology', 'Neurology', 'Psychiatry',
  'Ophthalmology', 'ENT', 'Dentistry', 'Urology',
  'Gastroenterology', 'Pulmonology', 'Endocrinology', 'Oncology',
  'Nephrology', 'Rheumatology', 'Hematology', 'Allergy & Immunology',
  'Infectious Disease', 'Sports Medicine', 'Pain Management',
  'Geriatrics', 'Neonatology', 'Plastic Surgery', 'Vascular Surgery',
  'Radiology', 'Pathology', 'Anesthesiology', 'Emergency Medicine',
  'Family Medicine', 'Internal Medicine', 'Physiotherapy',
  'Ayurveda', 'Homeopathy', 'Nutrition & Dietetics'
];

const LANGUAGES = [
  'English', 'Hindi', 'Arabic', 'Spanish', 'French',
  'Mandarin', 'Tamil', 'Telugu', 'Malayalam', 'Urdu'
];

const INSURANCES = [
  'Aetna', 'BlueCross BlueShield', 'Cigna', 'UnitedHealthcare',
  'Humana', 'Kaiser Permanente', 'Medicare', 'Medicaid',
  'Daman', 'AXA', 'MetLife', 'HDFC ERGO', 'ICICI Lombard'
];

export default function DoctorOnboarding() {
  const { token, user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: 'Dr.',
    license_number: '',
    specialties: [],
    years_experience: '',
    qualifications: '',
    languages: ['English'],
    clinic_name: '',
    clinic_address: '',
    affiliation_type: 'clinic',
    consultation_types: ['in_person'],
    consultation_fee: '',
    accepted_insurances: [],
    bio: '',
    bio: '',
    profile_image: user?.profile_image || ''
  });
  const [profilePicUploading, setProfilePicUploading] = useState(false);

  const handleSpecialtyToggle = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  const handleLanguageToggle = (language) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleInsuranceToggle = (insurance) => {
    setFormData(prev => ({
      ...prev,
      accepted_insurances: prev.accepted_insurances.includes(insurance)
        ? prev.accepted_insurances.filter(i => i !== insurance)
        : [...prev.accepted_insurances, insurance]
    }));
  };

  const handleConsultationTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      consultation_types: prev.consultation_types.includes(type)
        ? prev.consultation_types.filter(t => t !== type)
        : [...prev.consultation_types, type]
    }));
  };

  const handleNext = () => {
    if (step === 1 && (!formData.license_number || formData.specialties.length === 0)) {
      toast.error('Please fill in license number and select at least one specialty');
      return;
    }
    if (step === 3) {
      if (!formData.clinic_name.trim()) {
        toast.error(`Please enter a ${formData.affiliation_type} name`);
        return;
      }
      if (formData.consultation_types.length === 0) {
        toast.error('Please select at least one consultation type');
        return;
      }
    }
    if (step === 4 && !formData.consultation_fee) {
      toast.error('Please set your consultation fee');
      return;
    }
    setStep(step + 1);
  };

  const handleProfilePictureUpload = async (file) => {
    if (!file) return;
    setProfilePicUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await axios.post(`${API_URL}/api/auth/profile/picture`, uploadFormData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const imageUrl = response.data.url;
      setFormData(prev => ({ ...prev, profile_image: imageUrl }));
      await fetchUser(); // Update user context
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading picture:', error);
      toast.error('Failed to upload picture');
    } finally {
      setProfilePicUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const data = {
        ...formData,
        affiliation_type: formData.affiliation_type,
        years_experience: parseInt(formData.years_experience) || 0,
        consultation_fee: parseFloat(formData.consultation_fee) || 0,
        qualifications: formData.qualifications.split(',').map(q => q.trim()).filter(Boolean)
      };

      await axios.post(`${API_URL}/api/doctors/profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Profile submitted for review!');
      navigate('/doctor');
    } catch (error) {
      console.error('Error submitting profile:', error);
      toast.error(error.response?.data?.detail || 'Failed to submit profile');
    } finally {
      setSubmitting(false);
    }
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background" data-testid="doctor-onboarding">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Complete Your Profile</h1>
          <p className="text-muted-foreground mb-4">
            Set up your doctor profile to start receiving patients
          </p>
          <Progress value={progress} className="h-2" />

          <div className="flex justify-between mt-4">
            {STEPS.map((s) => (
              <div
                key={s.id}
                className={`flex flex-col items-center ${s.id <= step ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center
                  ${s.id < step ? 'bg-primary text-white' : s.id === step ? 'border-2 border-primary' : 'border border-muted-foreground'}`}
                >
                  {s.id < step ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

                  {/* Profile Picture Section */}
                  <div className="mb-6 flex flex-col items-center">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-sm bg-muted flex items-center justify-center">
                        {formData.profile_image ? (
                          <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-10 h-10 text-muted-foreground" />
                        )}
                        {profilePicUploading && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleProfilePictureUpload(e.target.files[0])}
                          disabled={profilePicUploading}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3 font-medium">Profile Picture</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Select
                          value={formData.title}
                          onValueChange={(value) => setFormData({ ...formData, title: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dr.">Dr.</SelectItem>
                            <SelectItem value="Prof.">Prof.</SelectItem>
                            <SelectItem value="Mr.">Mr.</SelectItem>
                            <SelectItem value="Ms.">Ms.</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="license_number">Medical License Number *</Label>
                        <Input
                          id="license_number"
                          value={formData.license_number}
                          onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                          placeholder="Enter license number"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Specialties * (Select at least one)</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SPECIALTIES.map(specialty => (
                          <Badge
                            key={specialty}
                            variant={formData.specialties.includes(specialty) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => handleSpecialtyToggle(specialty)}
                          >
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="years_experience">Years of Experience</Label>
                      <Input
                        id="years_experience"
                        type="number"
                        min="0"
                        value={formData.years_experience}
                        onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                        placeholder="Enter years of experience"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Qualifications */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Qualifications & Languages</h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="qualifications">Qualifications (comma-separated)</Label>
                      <Textarea
                        id="qualifications"
                        value={formData.qualifications}
                        onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                        placeholder="e.g., MBBS, MD, Fellowship in Cardiology"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Languages</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {LANGUAGES.map(language => (
                          <Badge
                            key={language}
                            variant={formData.languages.includes(language) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => handleLanguageToggle(language)}
                          >
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio">Short Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell patients about yourself..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Practice */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Practice Details</h2>

                  <div className="space-y-4">
                    <div>
                      <Label>Affiliation Type *</Label>
                      <div className="flex gap-4 mt-2">
                        <label className={`flex items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all flex-1 ${formData.affiliation_type === 'clinic' ? 'border-primary bg-primary/5' : 'border-border'
                          }`}>
                          <input type="radio" name="affiliation" value="clinic"
                            checked={formData.affiliation_type === 'clinic'}
                            onChange={() => setFormData({ ...formData, affiliation_type: 'clinic' })}
                            className="sr-only" />
                          <Building className="w-5 h-5" />
                          <span className="font-medium">Clinic</span>
                        </label>
                        <label className={`flex items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all flex-1 ${formData.affiliation_type === 'hospital' ? 'border-primary bg-primary/5' : 'border-border'
                          }`}>
                          <input type="radio" name="affiliation" value="hospital"
                            checked={formData.affiliation_type === 'hospital'}
                            onChange={() => setFormData({ ...formData, affiliation_type: 'hospital' })}
                            className="sr-only" />
                          <Building className="w-5 h-5" />
                          <span className="font-medium">Hospital</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="clinic_name">{formData.affiliation_type === 'hospital' ? 'Hospital' : 'Clinic'} Name *</Label>
                      <Input
                        id="clinic_name"
                        value={formData.clinic_name}
                        onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                        placeholder={`Enter ${formData.affiliation_type} name`}
                      />
                    </div>

                    <div>
                      <Label htmlFor="clinic_address">Clinic Address</Label>
                      <Textarea
                        id="clinic_address"
                        value={formData.clinic_address}
                        onChange={(e) => setFormData({ ...formData, clinic_address: e.target.value })}
                        placeholder="Enter full clinic address"
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Consultation Types * (Select at least one)</Label>
                      <div className="flex gap-4 mt-2">
                        <label className={`flex items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.consultation_types.includes('in_person')
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                          }`}>
                          <Checkbox
                            checked={formData.consultation_types.includes('in_person')}
                            onCheckedChange={() => handleConsultationTypeToggle('in_person')}
                          />
                          <span>In-Person</span>
                        </label>
                        <label className={`flex items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.consultation_types.includes('telehealth')
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                          }`}>
                          <Checkbox
                            checked={formData.consultation_types.includes('telehealth')}
                            onCheckedChange={() => handleConsultationTypeToggle('telehealth')}
                          />
                          <span>Telehealth</span>
                        </label>
                        <label className={`flex items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.consultation_types.includes('home_visit')
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                          }`}>
                          <Checkbox
                            checked={formData.consultation_types.includes('home_visit')}
                            onCheckedChange={() => handleConsultationTypeToggle('home_visit')}
                          />
                          <span>Home Visit</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label>Accepted Insurance</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {INSURANCES.map(insurance => (
                          <Badge
                            key={insurance}
                            variant={formData.accepted_insurances.includes(insurance) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => handleInsuranceToggle(insurance)}
                          >
                            {insurance}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Pricing */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Consultation Fee</h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="consultation_fee">Fee per Consultation (₹) *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          id="consultation_fee"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.consultation_fee}
                          onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                          placeholder="100.00"
                          className="pl-8"
                          required
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        This will be the standard fee for both in-person and telehealth consultations.
                      </p>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-xl">
                      <h3 className="font-medium mb-2">Summary</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Specialties:</span>
                          <span>{formData.specialties.join(', ') || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Experience:</span>
                          <span>{formData.years_experience || '0'} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Consultation Types:</span>
                          <span>{formData.consultation_types.join(', ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fee:</span>
                          <span className="font-semibold">₹{formData.consultation_fee || '0'}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                      Your profile will be reviewed by our team before going live.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => step > 1 ? setStep(step - 1) : navigate('/doctor')}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              {step < 4 ? (
                <Button onClick={handleNext} className="gap-2 rounded-full">
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting} className="gap-2 rounded-full">
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit for Review
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
