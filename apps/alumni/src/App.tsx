import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import SplashScreen from './components/ui/SplashScreen'
import DashboardLayout from './components/layout/DashboardLayout'
import AuthLayout from './components/layout/AuthLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/common/ErrorBoundary'

// Auth pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'))

// Dashboard pages
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'))
const EventsPage = lazy(() => import('./pages/events/EventsPage'))
const EventDetailPage = lazy(() => import('./pages/events/EventDetailPage'))
const NewsPage = lazy(() => import('./pages/news/NewsPage'))
const NewsDetailPage = lazy(() => import('./pages/news/NewsDetailPage'))
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'))
const DonationsPage = lazy(() => import('./pages/donations/DonationsPage'))
const DuesPage = lazy(() => import('./pages/dues/DuesPage'))
const JobsPage = lazy(() => import('./pages/jobs/JobsPage'))
const JobDetailPage = lazy(() => import('./pages/jobs/JobDetailPage'))
const MentorshipPage = lazy(() => import('./pages/mentorship/MentorshipPage'))
const MyRequestsPage = lazy(() => import('./pages/mentorship/MyRequestsPage'))
const ForumPage = lazy(() => import('./pages/forum/ForumPage'))
const ForumPostPage = lazy(() => import('./pages/forum/ForumPostPage'))
const PollsPage = lazy(() => import('./pages/polls/PollsPage'))
const ElectionsPage = lazy(() => import('./pages/elections/ElectionsPage'))
const MembersPage = lazy(() => import('./pages/members/MembersPage'))
const MemberProfilePage = lazy(() => import('./pages/members/MemberProfilePage'))
const ContactPage = lazy(() => import('./pages/contact/ContactPage'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))
const RequestsPage = lazy(() => import('./pages/requests/RequestsPage'))
const GalleryPage = lazy(() => import('./pages/gallery/GalleryPage'))
const HelpPage = lazy(() => import('./pages/help/HelpPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function PageLoader() {
  return <SplashScreen />
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ErrorBoundary>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          </Route>

          {/* Protected dashboard routes */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:slug" element={<EventDetailPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:slug" element={<NewsDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:slug" element={<ProjectDetailPage />} />
            <Route path="/donations" element={<DonationsPage />} />
            <Route path="/dues" element={<DuesPage />} />
            <Route path="/jobs" element={<JobsPage />} />
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/mentorship" element={<MentorshipPage />} />
            <Route path="/mentorship/requests" element={<MyRequestsPage />} />
            <Route path="/forum" element={<ForumPage />} />
            <Route path="/forum/:slug" element={<ForumPostPage />} />
            <Route path="/polls" element={<PollsPage />} />
            <Route path="/elections" element={<ElectionsPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/members/:id" element={<MemberProfilePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </Suspense>
  )
}
