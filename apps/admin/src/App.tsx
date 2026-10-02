import { lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import NotFoundPage from './pages/NotFoundPage'
import ToastContainer from './components/ui/ToastContainer'

// Route pages are code-split; the auth pages and layout shell stay in the main bundle.
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const AlumniRegistrationsPage = lazy(() => import('./pages/alumni/AlumniRegistrationsPage'))
const MembersDirectoryPage = lazy(() => import('./pages/members/MembersDirectoryPage'))
const EventsPage = lazy(() => import('./pages/events/EventsPage'))
const EventFormPage = lazy(() => import('./pages/events/EventFormPage'))
const EventDetailPage = lazy(() => import('./pages/events/EventDetailPage'))
const NewsPage = lazy(() => import('./pages/news/NewsPage'))
const NewsDetailPage = lazy(() => import('./pages/news/NewsDetailPage'))
const NewsFormPage = lazy(() => import('./pages/news/NewsFormPage'))
const ProjectsPage = lazy(() => import('./pages/projects/ProjectsPage'))
const ProjectDetailPage = lazy(() => import('./pages/projects/ProjectDetailPage'))
const ProjectFormPage = lazy(() => import('./pages/projects/ProjectFormPage'))
const DonationsPage = lazy(() => import('./pages/donations/DonationsPage'))
const DonationFormPage = lazy(() => import('./pages/donations/DonationFormPage'))
const DonationDetailPage = lazy(() => import('./pages/donations/DonationDetailPage'))
const DuesPage = lazy(() => import('./pages/dues/DuesPage'))
const RolesPage = lazy(() => import('./pages/roles/RolesPage'))
const AdminUsersPage = lazy(() => import('./pages/admin-users/AdminUsersPage'))
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'))
const AboutContentPage = lazy(() => import('./pages/about-content/AboutContentPage'))
const ExecutivesPage = lazy(() => import('./pages/executives/ExecutivesPage'))
const JobsPage = lazy(() => import('./pages/jobs/JobsPage'))
const JobFormPage = lazy(() => import('./pages/jobs/JobFormPage'))
const JobDetailPage = lazy(() => import('./pages/jobs/JobDetailPage'))
const ElectionsPage = lazy(() => import('./pages/elections/ElectionsPage'))
const ElectionFormPage = lazy(() => import('./pages/elections/ElectionFormPage'))
const ElectionDetailPage = lazy(() => import('./pages/elections/ElectionDetailPage'))
const PollsPage = lazy(() => import('./pages/polls/PollsPage'))
const PollFormPage = lazy(() => import('./pages/polls/PollFormPage'))
const PollDetailPage = lazy(() => import('./pages/polls/PollDetailPage'))
const ForumPage = lazy(() => import('./pages/forum/ForumPage'))
const AnnouncementsPage = lazy(() => import('./pages/announcements/AnnouncementsPage'))
const AnnouncementFormPage = lazy(() => import('./pages/announcements/AnnouncementFormPage'))
const AnnouncementDetailPage = lazy(() => import('./pages/announcements/AnnouncementDetailPage'))
const ExecutiveFormPage = lazy(() => import('./pages/executives/ExecutiveFormPage'))
const ExecutiveDetailPage = lazy(() => import('./pages/executives/ExecutiveDetailPage'))
const AlumniDetailPage = lazy(() => import('./pages/alumni/AlumniDetailPage'))
const AdminUserFormPage = lazy(() => import('./pages/admin-users/AdminUserFormPage'))
const ContactMessagesPage = lazy(() => import('./pages/contact-messages/ContactMessagesPage'))
const SiteConfigPage = lazy(() => import('./pages/site-config/SiteConfigPage'))
const PaymentMethodsPage = lazy(() => import('./pages/payment-methods/PaymentMethodsPage'))
const PaymentMethodFormPage = lazy(() => import('./pages/payment-methods/PaymentMethodFormPage'))
const GalleryPage = lazy(() => import('./pages/gallery/GalleryPage'))
const GalleryCategoryPage = lazy(() => import('./pages/gallery/GalleryCategoryPage'))
const SchoolLeadersPage = lazy(() => import('./pages/school-leaders/SchoolLeadersPage'))
const SchoolLeaderFormPage = lazy(() => import('./pages/school-leaders/SchoolLeaderFormPage'))
const NewsletterPage = lazy(() => import('./pages/newsletter/NewsletterPage'))
const HelpPage = lazy(() => import('./pages/help/HelpPage'))

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route
              path="/alumni-registrations"
              element={
                <ProtectedRoute requiredPermission="alumni:view">
                  <AlumniRegistrationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni-registrations/:id"
              element={
                <ProtectedRoute requiredPermission="alumni:view">
                  <AlumniDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/members"
              element={
                <ProtectedRoute requiredPermission="members:view">
                  <MembersDirectoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute requiredPermission="events:view">
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/new"
              element={
                <ProtectedRoute requiredPermission="events:create">
                  <EventFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:slug"
              element={
                <ProtectedRoute requiredPermission="events:view">
                  <EventDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:slug/edit"
              element={
                <ProtectedRoute requiredPermission="events:edit">
                  <EventFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/news"
              element={
                <ProtectedRoute requiredPermission="news:view">
                  <NewsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/news/new"
              element={
                <ProtectedRoute requiredPermission="news:create">
                  <NewsFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/news/:id"
              element={
                <ProtectedRoute requiredPermission="news:view">
                  <NewsDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/news/:id/edit"
              element={
                <ProtectedRoute requiredPermission="news:edit">
                  <NewsFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute requiredPermission="projects:view">
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/new"
              element={
                <ProtectedRoute requiredPermission="projects:create">
                  <ProjectFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute requiredPermission="projects:view">
                  <ProjectDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id/edit"
              element={
                <ProtectedRoute requiredPermission="projects:edit">
                  <ProjectFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donations"
              element={
                <ProtectedRoute requiredPermission="donations:view">
                  <DonationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donations/new"
              element={
                <ProtectedRoute requiredPermission="donations:create">
                  <DonationFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donations/:id"
              element={
                <ProtectedRoute requiredPermission="donations:view">
                  <DonationDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/donations/:id/edit"
              element={
                <ProtectedRoute requiredPermission="donations:edit">
                  <DonationFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dues"
              element={
                <ProtectedRoute requiredPermission="donations:view">
                  <DuesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <ProtectedRoute requiredPermission="roles:view">
                  <RolesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-users"
              element={
                <ProtectedRoute requiredPermission="admin_users:view">
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-users/new"
              element={
                <ProtectedRoute requiredPermission="admin_users:create">
                  <AdminUserFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-users/:id/edit"
              element={
                <ProtectedRoute requiredPermission="admin_users:edit">
                  <AdminUserFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredPermission="settings:view">
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* New routes */}
            <Route
              path="/about-content"
              element={
                <ProtectedRoute requiredPermission="content:view">
                  <AboutContentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/executives"
              element={
                <ProtectedRoute requiredPermission="executives:view">
                  <ExecutivesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/executives/new"
              element={
                <ProtectedRoute requiredPermission="executives:create">
                  <ExecutiveFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/executives/:id"
              element={
                <ProtectedRoute requiredPermission="executives:view">
                  <ExecutiveDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/executives/:id/edit"
              element={
                <ProtectedRoute requiredPermission="executives:edit">
                  <ExecutiveFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <ProtectedRoute requiredPermission="jobs:view">
                  <JobsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/new"
              element={
                <ProtectedRoute requiredPermission="jobs:create">
                  <JobFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:id"
              element={
                <ProtectedRoute requiredPermission="jobs:view">
                  <JobDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs/:id/edit"
              element={
                <ProtectedRoute requiredPermission="jobs:edit">
                  <JobFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections"
              element={
                <ProtectedRoute requiredPermission="elections:view">
                  <ElectionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections/new"
              element={
                <ProtectedRoute requiredPermission="elections:create">
                  <ElectionFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections/:id"
              element={
                <ProtectedRoute requiredPermission="elections:view">
                  <ElectionDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/elections/:id/edit"
              element={
                <ProtectedRoute requiredPermission="elections:edit">
                  <ElectionFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/polls"
              element={
                <ProtectedRoute requiredPermission="polls:view">
                  <PollsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/polls/new"
              element={
                <ProtectedRoute requiredPermission="polls:create">
                  <PollFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/polls/:id"
              element={
                <ProtectedRoute requiredPermission="polls:view">
                  <PollDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/polls/:id/edit"
              element={
                <ProtectedRoute requiredPermission="polls:edit">
                  <PollFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum"
              element={
                <ProtectedRoute requiredPermission="forum:view">
                  <ForumPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <ProtectedRoute requiredPermission="announcements:view">
                  <AnnouncementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements/new"
              element={
                <ProtectedRoute requiredPermission="announcements:create">
                  <AnnouncementFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements/:id"
              element={
                <ProtectedRoute requiredPermission="announcements:view">
                  <AnnouncementDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements/:id/edit"
              element={
                <ProtectedRoute requiredPermission="announcements:edit">
                  <AnnouncementFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contact-messages"
              element={
                <ProtectedRoute requiredPermission="contact:view">
                  <ContactMessagesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-methods"
              element={
                <ProtectedRoute requiredPermission="settings:edit">
                  <PaymentMethodsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment-methods/:id/edit"
              element={
                <ProtectedRoute requiredPermission="settings:edit">
                  <PaymentMethodFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/site-config"
              element={
                <ProtectedRoute requiredPermission="settings:edit">
                  <SiteConfigPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gallery"
              element={
                <ProtectedRoute requiredPermission="content:view">
                  <GalleryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gallery/:id"
              element={
                <ProtectedRoute requiredPermission="content:view">
                  <GalleryCategoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-leaders"
              element={
                <ProtectedRoute requiredPermission="content:view">
                  <SchoolLeadersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-leaders/new"
              element={
                <ProtectedRoute requiredPermission="content:create">
                  <SchoolLeaderFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/school-leaders/:id/edit"
              element={
                <ProtectedRoute requiredPermission="content:edit">
                  <SchoolLeaderFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/newsletter"
              element={
                <ProtectedRoute requiredPermission="settings:view">
                  <NewsletterPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
