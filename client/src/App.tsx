import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/use-auth';
import { RequireRole } from './components/require-role';
import { AppLayout } from './components/layout/app-layout';

// Auth pages
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import ForgotPasswordPage from './pages/forgot-password';
import ResetPasswordPage from './pages/reset-password';
import InvitePage from './pages/invite';

// Dashboard and project pages
import DashboardPage from './pages/dashboard';
import ProjectOverviewPage from './pages/project-overview';
import ProjectSourcesPage from './pages/project-sources';
import SourceDetailPage from './pages/source-detail';
import AddSourceUploadPage from './pages/add-source-upload';
import AddSourceApiPage from './pages/add-source-api';
import ProjectConfigurationPage from './pages/project-configuration';
import FieldMappingPage from './pages/field-mapping';
import PiiConfigurationPage from './pages/pii-configuration';
import PiiPreviewPage from './pages/pii-preview';
import ProcessingPage from './pages/processing';
import QualitySettingsPage from './pages/quality-settings';
import ExportsPage from './pages/exports';
import AuditPage from './pages/audit';

// Settings pages
import OrgSettingsPage from './pages/org-settings';
import MemberManagementPage from './pages/member-management';
import UserProfilePage from './pages/user-profile';

// Error pages
import NotFoundPage from './pages/not-found';
import ErrorPage from './pages/error-page';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/invite/:token" element={<InvitePage />} />
      <Route path="/error" element={<ErrorPage />} />

      {/* Protected routes */}
      <Route element={<RequireRole><AppLayout /></RequireRole>}>
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />

        {/* Project routes */}
        <Route path="/projects/:id" element={<ProjectOverviewPage />} />
        <Route path="/projects/:id/sources" element={<ProjectSourcesPage />} />
        <Route path="/projects/:id/sources/:sourceId" element={<SourceDetailPage />} />
        <Route path="/projects/:id/sources/new/upload" element={<AddSourceUploadPage />} />
        <Route path="/projects/:id/sources/new/api" element={<AddSourceApiPage />} />
        <Route path="/projects/:id/configuration" element={<ProjectConfigurationPage />} />
        <Route path="/projects/:id/configuration/mapping" element={<FieldMappingPage />} />
        <Route path="/projects/:id/configuration/pii" element={<PiiConfigurationPage />} />
        <Route path="/projects/:id/configuration/pii/preview" element={<PiiPreviewPage />} />
        <Route path="/projects/:id/processing" element={<ProcessingPage />} />
        <Route path="/projects/:id/processing/quality" element={<QualitySettingsPage />} />
        <Route path="/projects/:id/exports" element={<ExportsPage />} />
        <Route path="/projects/:id/audit" element={<AuditPage />} />

        {/* Settings routes */}
        <Route path="/settings" element={<OrgSettingsPage />} />
        <Route path="/settings/members" element={<MemberManagementPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
