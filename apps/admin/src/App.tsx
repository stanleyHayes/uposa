import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import DashboardLayout from './components/layout/DashboardLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import AlumniRegistrationsPage from './pages/alumni/AlumniRegistrationsPage'
import MembersDirectoryPage from './pages/members/MembersDirectoryPage'
import EventsPage from './pages/events/EventsPage'
import EventFormPage from './pages/events/EventFormPage'
import EventDetailPage from './pages/events/EventDetailPage'
import NewsPage from './pages/news/NewsPage'
import NewsDetailPage from './pages/news/NewsDetailPage'
import NewsFormPage from './pages/news/NewsFormPage'
import ProjectsPage from './pages/projects/ProjectsPage'
import ProjectDetailPage from './pages/projects/ProjectDetailPage'
import ProjectFormPage from './pages/projects/ProjectFormPage'
import DonationsPage from './pages/donations/DonationsPage'
import DonationFormPage from './pages/donations/DonationFormPage'
import DonationDetailPage from './pages/donations/DonationDetailPage'
import RolesPage from './pages/roles/RolesPage'
import AdminUsersPage from './pages/admin-users/AdminUsersPage'
import SettingsPage from './pages/settings/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'
import ToastContainer from './components/ui/ToastContainer'
import AboutContentPage from './pages/about-content/AboutContentPage'
import ExecutivesPage from './pages/executives/ExecutivesPage'
import JobsPage from './pages/jobs/JobsPage'
import JobFormPage from './pages/jobs/JobFormPage'
import JobDetailPage from './pages/jobs/JobDetailPage'
import ElectionsPage from './pages/elections/ElectionsPage'
import ElectionFormPage from './pages/elections/ElectionFormPage'
import ElectionDetailPage from './pages/elections/ElectionDetailPage'
import PollsPage from './pages/polls/PollsPage'
import PollFormPage from './pages/polls/PollFormPage'
import PollDetailPage from './pages/polls/PollDetailPage'
import ForumPage from './pages/forum/ForumPage'
import AnnouncementsPage from './pages/announcements/AnnouncementsPage'
import AnnouncementFormPage from './pages/announcements/AnnouncementFormPage'
import AnnouncementDetailPage from './pages/announcements/AnnouncementDetailPage'
import ExecutiveFormPage from './pages/executives/ExecutiveFormPage'
import ExecutiveDetailPage from './pages/executives/ExecutiveDetailPage'
import AlumniDetailPage from './pages/alumni/AlumniDetailPage'
import AdminUserFormPage from './pages/admin-users/AdminUserFormPage'
import ContactMessagesPage from './pages/contact-messages/ContactMessagesPage'
import SiteConfigPage from './pages/site-config/SiteConfigPage'
import PaymentMethodsPage from './pages/payment-methods/PaymentMethodsPage'
import PaymentMethodFormPage from './pages/payment-methods/PaymentMethodFormPage'
import GalleryPage from './pages/gallery/GalleryPage'
import GalleryCategoryPage from './pages/gallery/GalleryCategoryPage'
import SchoolLeadersPage from './pages/school-leaders/SchoolLeadersPage'
import SchoolLeaderFormPage from './pages/school-leaders/SchoolLeaderFormPage'
import NewsletterPage from './pages/newsletter/NewsletterPage'

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
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
              path="/events/:id"
              element={
                <ProtectedRoute requiredPermission="events:view">
                  <EventDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:id/edit"
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
