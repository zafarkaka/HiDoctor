import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import RegisterPage from "./pages/RegisterPage";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDiscovery from "./pages/DoctorDiscovery";
import DoctorProfile from "./pages/DoctorProfile";
import BookingFlow from "./pages/BookingFlow";
import AppointmentDetails from "./pages/AppointmentDetails";
import FamilyMembers from "./pages/FamilyMembers";
import FamilyMembers from "./pages/FamilyMembers";
import BlogPage from "./pages/BlogPage";
import BlogPost from "./pages/BlogPost";
import ProfileSettings from "./pages/ProfileSettings";
import NotificationsPage from "./pages/NotificationsPage";
import DoctorOnboarding from "./pages/DoctorOnboarding";

import { AIAssistantWrapper } from "./components/Layout";

// Protected Route Component
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/doctors" element={<DoctorDiscovery />} />
          <Route path="/doctors/:doctorId" element={<DoctorProfile />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPost />} />

          {/* Patient Routes */}
          <Route path="/patient" element={<ProtectedRoute allowedRoles={["patient"]}><PatientDashboard /></ProtectedRoute>} />
          <Route path="/booking/:doctorId" element={<ProtectedRoute allowedRoles={["patient"]}><BookingFlow /></ProtectedRoute>} />
          <Route path="/family-members" element={<ProtectedRoute allowedRoles={["patient"]}><FamilyMembers /></ProtectedRoute>} />

          {/* Doctor Routes */}
          <Route path="/doctor" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/onboarding" element={<ProtectedRoute allowedRoles={["doctor"]}><DoctorOnboarding /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />

          {/* Shared Routes */}
          <Route path="/appointments/:appointmentId" element={<ProtectedRoute><AppointmentDetails /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AIAssistantWrapper />
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
