// @ts-nocheck
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, Clock, Calendar, FolderKanban, UserCheck,
  PlusCircle, FileText, Activity, HandCoins,
  ArrowRight, Newspaper, BarChart3, MessageSquare,
  Mail, Briefcase, Handshake, AlertCircle,
  CheckCircle2, XCircle, Send,
} from 'lucide-react'
import RoleGate from '../../components/auth/RoleGate'
import { useAuth } from '../../hooks/useAuth'
import { useActivityStore } from '../../stores/activity.store'
import { ROLES } from '../../constants/roles'
import { formatTimeAgo } from '../../utils/formatters'
import client from '../../api/client'

interface DashboardData {
  overview: {
    totalMembers: number
    pendingApprovals: number
    activeMembers: number
    donationsTotal: number
    upcomingEventsCount: number
    activeProjectsCount: number
    unreadMessagesCount: number
    totalForumPosts: number
    totalJobs: number
    pendingJobs: number
    activePolls: number
    activeElections: number
    pendingMentorshipRequests: number
    totalMentors: number
    totalJobApplications: number
    newsletterSubscribers: number
  }
  recentMembers: Array<{ id: string; fullName: string; email: string; membershipStatus: string; createdAt: string }>
  recentDonations: Array<{ donorName: string; amount: number; currency: string; createdAt: string }>
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { entries } = useActivityStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    client.get('/admin/dashboard/stats')
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const recentActivity = entries.slice(0, 6)
  const o = data?.overview

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="page-enter space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-900 via-brand-700 to-brand-500 p-6 md:p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cream-100/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-cream-100/5 rounded-full translate-y-1/2" />
        <div className="absolute top-4 right-12 w-3 h-3 bg-cream-100/20 rounded-full" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-cream-100/60 text-sm font-medium mb-1">
              {currentUser ? ROLES[currentUser.role] : ''}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-cream-100">
              {greeting()}, {currentUser?.name?.split(' ')[0]}
            </h1>
            <p className="text-cream-100/50 mt-1 text-sm">
              Here's what's happening with UPOSA today.
            </p>
          </div>
          <div className="flex gap-2">
            <RoleGate permission="events:create">
              <button onClick={() => navigate('/events/new')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/10 text-white text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <PlusCircle size={14} />
                New Event
              </button>
            </RoleGate>
            <RoleGate permission="news:create">
              <button onClick={() => navigate('/news/new')} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/10 text-white text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <FileText size={14} />
                Post News
              </button>
            </RoleGate>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200/80 dark:border-dark-border p-5 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 dark:bg-dark-hover rounded-xl mb-4" />
              <div className="h-8 w-16 bg-gray-200 dark:bg-dark-hover rounded mb-2" />
              <div className="h-4 w-24 bg-gray-100 dark:bg-dark-hover rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Primary Stats */}
          <motion.div
            className="grid grid-cols-2 xl:grid-cols-4 gap-4"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          >
            {[
              { label: 'Total Members', value: o?.totalMembers ?? 0, icon: Users, bg: 'bg-brand-50 dark:bg-brand-950/30', color: 'text-brand-600 dark:text-brand-300', accent: 'before:bg-gradient-to-bl before:from-brand-100/40 before:to-transparent dark:before:from-brand-900/20' },
              { label: 'Pending Approvals', value: o?.pendingApprovals ?? 0, icon: Clock, bg: 'bg-amber-50 dark:bg-amber-950/30', color: 'text-amber-600 dark:text-amber-400', alert: (o?.pendingApprovals ?? 0) > 0, accent: 'before:bg-gradient-to-br before:from-amber-100/40 before:to-transparent dark:before:from-amber-900/15' },
              { label: 'Upcoming Events', value: o?.upcomingEventsCount ?? 0, icon: Calendar, bg: 'bg-brand-50 dark:bg-brand-950/30', color: 'text-brand-500 dark:text-brand-300', accent: 'before:bg-gradient-to-tl before:from-brand-100/30 before:to-transparent dark:before:from-brand-900/15' },
              { label: 'Donations (GHS)', value: (o?.donationsTotal ?? 0).toLocaleString(), icon: HandCoins, bg: 'bg-emerald-50 dark:bg-emerald-950/30', color: 'text-emerald-600 dark:text-emerald-400', accent: 'before:bg-gradient-to-tr before:from-emerald-100/30 before:to-transparent dark:before:from-emerald-900/15' },
            ].map(({ label, value, icon: Icon, bg, color, alert, accent }) => (
              <motion.div
                key={label}
                variants={{ hidden: { opacity: 0, y: 14, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } } }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className={`relative overflow-hidden bg-white dark:bg-dark-card rounded-2xl border border-gray-200/80 dark:border-dark-border p-5 transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,27,80,0.07)] before:absolute before:top-0 before:right-0 before:w-24 before:h-24 before:rounded-bl-[48px] ${accent}`}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      className={`${bg} rounded-xl p-2.5 shadow-sm`}
                      whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.5 } }}
                    >
                      <Icon size={20} className={color} />
                    </motion.div>
                    {alert && (
                      <span className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                        <AlertCircle size={12} /> Action needed
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-none mb-1 tracking-tight">{value}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                </div>
                {/* Bottom gradient accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-300/25 to-transparent dark:via-brand-600/15" />
              </motion.div>
            ))}
          </motion.div>

          {/* Analytics Grid */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } } }}
          >
            {[
              { label: 'Active Members', value: o?.activeMembers ?? 0, icon: UserCheck, color: 'text-brand-600 dark:text-brand-300', gradient: 'from-brand-50/60 to-transparent dark:from-brand-950/20' },
              { label: 'Active Projects', value: o?.activeProjectsCount ?? 0, icon: FolderKanban, color: 'text-brand-500 dark:text-brand-400', gradient: 'from-brand-50/40 to-transparent dark:from-brand-950/15' },
              { label: 'Forum Posts', value: o?.totalForumPosts ?? 0, icon: MessageSquare, color: 'text-brand-600 dark:text-brand-300', gradient: 'from-brand-50/60 to-transparent dark:from-brand-950/20' },
              { label: 'Active Polls', value: o?.activePolls ?? 0, icon: BarChart3, color: 'text-brand-500 dark:text-brand-400', gradient: 'from-brand-50/40 to-transparent dark:from-brand-950/15' },
              { label: 'Job Listings', value: o?.totalJobs ?? 0, icon: Briefcase, color: 'text-brand-600 dark:text-brand-300', gradient: 'from-brand-50/60 to-transparent dark:from-brand-950/20' },
              { label: 'Mentors', value: o?.totalMentors ?? 0, icon: Handshake, color: 'text-brand-500 dark:text-brand-400', gradient: 'from-brand-50/40 to-transparent dark:from-brand-950/15' },
              { label: 'Newsletter Subs', value: o?.newsletterSubscribers ?? 0, icon: Send, color: 'text-brand-600 dark:text-brand-300', gradient: 'from-brand-50/60 to-transparent dark:from-brand-950/20' },
            ].map(({ label, value, icon: Icon, color, gradient }) => (
              <motion.div
                key={label}
                variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 400, damping: 25 } } }}
                whileHover={{ y: -2, scale: 1.03, transition: { duration: 0.15 } }}
                className={`relative overflow-hidden bg-white dark:bg-dark-card rounded-xl border border-gray-200/80 dark:border-dark-border p-3.5 text-center bg-gradient-to-b ${gradient}`}
              >
                <motion.div
                  whileHover={{ rotate: 12, scale: 1.15, transition: { duration: 0.3 } }}
                >
                  <Icon size={18} className={`${color} mx-auto mb-1.5`} />
                </motion.div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-tight">{value}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">{label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Attention Items */}
          {((o?.pendingApprovals ?? 0) > 0 || (o?.unreadMessagesCount ?? 0) > 0 || (o?.pendingJobs ?? 0) > 0 || (o?.pendingMentorshipRequests ?? 0) > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Pending Registrations', value: o?.pendingApprovals ?? 0, icon: UserCheck, path: '/alumni-registrations', permission: 'alumni:view' },
                { label: 'Unread Messages', value: o?.unreadMessagesCount ?? 0, icon: Mail, path: '/contact-messages', permission: 'contact:view' },
                { label: 'Pending Jobs', value: o?.pendingJobs ?? 0, icon: Briefcase, path: '/jobs', permission: 'jobs:view' },
                { label: 'Mentorship Requests', value: o?.pendingMentorshipRequests ?? 0, icon: Handshake, path: '/mentorship', permission: 'members:view' },
              ].filter(item => item.value > 0).map(({ label, value, icon: Icon, path, permission }) => (
                <RoleGate key={path} permission={permission}>
                  <button
                    onClick={() => navigate(path)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors active:scale-[0.98] group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-amber-200 dark:bg-amber-800/50 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-amber-700 dark:text-amber-300" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-lg font-bold text-amber-800 dark:text-amber-200 leading-tight">{value}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">{label}</p>
                    </div>
                    <ArrowRight size={14} className="text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </RoleGate>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200/80 dark:border-dark-border p-5">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wider">Quick Actions</h2>
              <div className="space-y-2 stagger">
                {[
                  { label: 'Review Registrations', icon: UserCheck, path: '/alumni-registrations', permission: 'alumni:view' },
                  { label: 'Manage Events', icon: Calendar, path: '/events', permission: 'events:create' },
                  { label: 'Post News', icon: Newspaper, path: '/news', permission: 'news:create' },
                  { label: 'Record Donation', icon: HandCoins, path: '/donations', permission: 'donations:create' },
                  { label: 'Members Directory', icon: Users, path: '/members', permission: 'members:view' },
                ].map(({ label, icon: Icon, path, permission }) => (
                  <RoleGate key={path} permission={permission}>
                    <button
                      onClick={() => navigate(path)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-dark-hover hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all duration-150 active:scale-[0.98] group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center">
                        <Icon size={16} className="text-brand-600 dark:text-brand-300" />
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 text-left">{label}</span>
                      <ArrowRight size={14} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </RoleGate>
                ))}
              </div>
            </div>

            {/* Recent Members + Donations */}
            <div className="space-y-6 lg:col-span-2">
              {/* Recent Members */}
              <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200/80 dark:border-dark-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Recent Registrations</h2>
                  <button onClick={() => navigate('/alumni-registrations')} className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center gap-1">
                    View all <ArrowRight size={12} />
                  </button>
                </div>
                {(data?.recentMembers?.length ?? 0) === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No recent registrations</p>
                ) : (
                  <div className="space-y-2 stagger-fast">
                    {data?.recentMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors">
                        <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-brand-600 dark:text-brand-300">
                            {member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{member.fullName}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{member.email}</p>
                        </div>
                        <div className="shrink-0">
                          {member.membershipStatus === 'ACTIVE' ? (
                            <CheckCircle2 size={16} className="text-emerald-500" />
                          ) : member.membershipStatus === 'PENDING' ? (
                            <Clock size={16} className="text-amber-500" />
                          ) : (
                            <XCircle size={16} className="text-gray-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Donations */}
              <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200/80 dark:border-dark-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Recent Donations</h2>
                  <button onClick={() => navigate('/donations')} className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center gap-1">
                    View all <ArrowRight size={12} />
                  </button>
                </div>
                {(data?.recentDonations?.length ?? 0) === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No recent donations</p>
                ) : (
                  <div className="space-y-2 stagger-fast">
                    {data?.recentDonations.map((donation, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                          <HandCoins size={16} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{donation.donorName}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{formatTimeAgo(donation.createdAt)}</p>
                        </div>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {donation.currency} {donation.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200/80 dark:border-dark-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">Activity Log</h2>
              <Activity size={16} className="text-gray-400" />
            </div>
            {recentActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-dark-hover flex items-center justify-center mb-3">
                  <Activity size={20} className="text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Actions you take will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {recentActivity.map((entry) => (
                  <div key={entry.id} className="fade-in-down flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors">
                    <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-brand-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-200">
                        <span className="font-semibold">{entry.performedByName}</span>{' '}
                        <span className="text-gray-500 dark:text-gray-400">{entry.action}</span>
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatTimeAgo(entry.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
