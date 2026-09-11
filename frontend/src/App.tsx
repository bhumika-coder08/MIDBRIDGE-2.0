import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { JourneyProvider } from './context/JourneyContext.js';
import { NotificationProvider } from './context/NotificationContext.js';

// Public Pages
import { LandingPage } from './pages/LandingPage.js';
import { ExploreCountriesPage } from './pages/ExploreCountriesPage.js';
import { CountryDetailPage } from './pages/CountryDetailPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignupPage } from './pages/SignupPage.js';
import { VerifierPortalPage } from './pages/VerifierPortalPage.js';

// Authenticated Pages
import { DashboardPage } from './pages/DashboardPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { JourneyBuilderPage } from './pages/JourneyBuilderPage.js';
import { JourneyStagesPage } from './pages/JourneyStagesPage.js';
import { VaultPage } from './pages/VaultPage.js';
import { VerificationPage } from './pages/VerificationPage.js';
import { ScholarshipsPage } from './pages/ScholarshipsPage.js';
import { TranslatorPage } from './pages/TranslatorPage.js';
import { TravelPrepPage } from './pages/TravelPrepPage.js';
import { ArrivalModePage } from './pages/ArrivalModePage.js';
import { SharePackagesPage } from './pages/SharePackagesPage.js';
import { EmergencyModePage } from './pages/EmergencyModePage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { AdminPortalPage } from './pages/AdminPortalPage.js';
import { AuthorityPortalPage } from './pages/AuthorityPortalPage.js';
import { InstitutionPortalPage } from './pages/InstitutionPortalPage.js';
import { AdminLoginPage } from './pages/AdminLoginPage.js';
import { HealthVaultPage } from './pages/HealthVaultPage.js';
import { MobilityTwinPage } from './pages/MobilityTwinPage.js';
import { CostPlannerPage } from './pages/CostPlannerPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-xs text-white/50">
        Authenticating MidBridge 2.0 session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <JourneyProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/countries" element={<ExploreCountriesPage />} />
              <Route path="/countries/:code" element={<CountryDetailPage />} />
              <Route path="/scholarships" element={<ScholarshipsPage />} />
              <Route path="/translator" element={<TranslatorPage />} />
              <Route path="/verify" element={<VerifierPortalPage />} />
              <Route path="/verify/:token" element={<VerifierPortalPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Authenticated Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/journey/builder" element={<ProtectedRoute><JourneyBuilderPage /></ProtectedRoute>} />
              <Route path="/journey/stages" element={<ProtectedRoute><JourneyStagesPage /></ProtectedRoute>} />
              <Route path="/vault" element={<ProtectedRoute><VaultPage /></ProtectedRoute>} />
              <Route path="/health-vault" element={<ProtectedRoute><HealthVaultPage /></ProtectedRoute>} />
              <Route path="/mobility-twin" element={<ProtectedRoute><MobilityTwinPage /></ProtectedRoute>} />
              <Route path="/cost-planner" element={<ProtectedRoute><CostPlannerPage /></ProtectedRoute>} />
              <Route path="/verification" element={<ProtectedRoute><VerificationPage /></ProtectedRoute>} />
              <Route path="/travel-prep" element={<ProtectedRoute><TravelPrepPage /></ProtectedRoute>} />
              <Route path="/arrival" element={<ProtectedRoute><ArrivalModePage /></ProtectedRoute>} />
              <Route path="/share" element={<ProtectedRoute><SharePackagesPage /></ProtectedRoute>} />
              <Route path="/emergency" element={<ProtectedRoute><EmergencyModePage /></ProtectedRoute>} />
              <Route path="/emergency/:token" element={<VerifierPortalPage />} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

              {/* Role-Gated Portals */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminPortalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/authority"
                element={
                  <ProtectedRoute allowedRoles={['AUTHORITY', 'ADMIN']}>
                    <AuthorityPortalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/institution"
                element={
                  <ProtectedRoute allowedRoles={['UNIVERSITY', 'ADMIN']}>
                    <InstitutionPortalPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </JourneyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
