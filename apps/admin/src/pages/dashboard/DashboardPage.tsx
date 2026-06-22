import { useEffect, useState, type ElementType, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  HandCoins,
  Handshake,
  Image,
  Inbox,
  Mail,
  Megaphone,
  MessageSquare,
  Newspaper,
  PlusCircle,
  Send,
  Settings,
  ShieldCheck,
  Target,
  UserCheck,
  Users,
  Vote,
  WalletCards,
  XCircle,
} from 'lucide-react'
import RoleGate from '../../components/auth/RoleGate'
import { useAuth } from '../../hooks/useAuth'
import { useActivityStore } from '../../stores/activity.store'
import { ROLES } from '../../constants/roles'
import { formatTimeAgo } from '../../utils/formatters'
import { Skeleton } from '../../components/ui/Skeleton'
import type { Permission } from '../../types'
import client from '../../api/client'

interface DashboardOverview {
  totalMembers: number
  pendingApprovals: number
  activeMembers: number
  donationsTotal: number
  confirmedDonationsCount: number
  pendingDonationsCount: number
  upcomingEventsCount: number
  activeProjectsCount: number
  unreadMessagesCount: number
  totalForumPosts: number
  totalForumComments: number
  totalJobs: number
  pendingJobs: number
  activePolls: number
  activeElections: number
  pendingMentorshipRequests: number
  totalMentors: number
  totalJobApplications: number
  newsletterSubscribers: number
  publishedNewsCount: number
  draftNewsCount: number
  eventRsvpCount: number
  pollVoteCount: number
  electionVoteCount: number
  paidDuesTotal: number
  paidDuesCount: number
  pendingDuesTotal: number
  pendingDuesCount: number
  overdueDuesCount: number
  galleryItemCount: number
  activeSchoolLeadersCount: number
  activeExecutivesCount: number
  enabledPaymentMethodsCount: number
  pendingTranscriptRequestsCount: number
  totalAdmins: number
  activeAdmins: number
  projectFundingGoal: number
  projectFundingRaised: number
}

interface ActivityTrendPoint {
  key: string
  label: string
  members: number
  donations: number
  content: number
  engagement: number
  events: number
}

interface FinancialBucket {
  channel?: string
  status?: string
  total: number
  count: number
}

interface DashboardData {
  overview: DashboardOverview
  activityTrend: ActivityTrendPoint[]
  financials: {
    donationsByChannel: FinancialBucket[]
    duesByStatus: FinancialBucket[]
  }
  recentMembers: Array<{ id: string; fullName: string; email: string; membershipStatus: string; createdAt: string }>
  recentDonations: Array<{ donorName: string; amount: number; currency: string; createdAt: string }>
  recentMessages: Array<{ id: string; name: string; subject: string; isRead: boolean; createdAt: string }>
  recentJobs: Array<{ id: string; title: string; company: string; createdAt: string }>
}

interface ApiResponse<T> {
  data?: T
}

interface SectionShellProps {
  title: string
  eyebrow?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

interface PlatformMetric {
  label: string
  value: string
  caption: string
  icon: ElementType
  tone: 'gold' | 'blue' | 'green' | 'amber'
  path: string
  permission: Permission
}

interface QueueItem {
  label: string
  value: number
  detail: string
  icon: ElementType
  path: string
  permission: Permission
  tone: 'danger' | 'warning' | 'neutral'
}

const emptyOverview: DashboardOverview = {
  totalMembers: 0,
  pendingApprovals: 0,
  activeMembers: 0,
  donationsTotal: 0,
  confirmedDonationsCount: 0,
  pendingDonationsCount: 0,
  upcomingEventsCount: 0,
  activeProjectsCount: 0,
  unreadMessagesCount: 0,
  totalForumPosts: 0,
  totalForumComments: 0,
  totalJobs: 0,
  pendingJobs: 0,
  activePolls: 0,
  activeElections: 0,
  pendingMentorshipRequests: 0,
  totalMentors: 0,
  totalJobApplications: 0,
  newsletterSubscribers: 0,
  publishedNewsCount: 0,
  draftNewsCount: 0,
  eventRsvpCount: 0,
  pollVoteCount: 0,
  electionVoteCount: 0,
  paidDuesTotal: 0,
  paidDuesCount: 0,
  pendingDuesTotal: 0,
  pendingDuesCount: 0,
  overdueDuesCount: 0,
  galleryItemCount: 0,
  activeSchoolLeadersCount: 0,
  activeExecutivesCount: 0,
  enabledPaymentMethodsCount: 0,
  pendingTranscriptRequestsCount: 0,
  totalAdmins: 0,
  activeAdmins: 0,
  projectFundingGoal: 0,
  projectFundingRaised: 0,
}

function compact(value: number) {
  return new Intl.NumberFormat('en', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function money(value: number, currency = 'GHS') {
  return `${currency} ${compact(value)}`
}

function percent(value: number, total: number) {
  if (!total) return 0
  return Math.min(100, Math.round((value / total) * 100))
}

function emptyTrend() {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return {
      key: `${date.getFullYear()}-${date.getMonth() + 1}`,
      label: date.toLocaleString('en-US', { month: 'short' }),
      members: 0,
      donations: 0,
      content: 0,
      engagement: 0,
      events: 0,
    }
  })
}

function statusIcon(status: string) {
  if (status === 'ACTIVE') return <CheckCircle2 size={15} className="text-emerald-500" />
  if (status === 'PENDING') return <Clock size={15} className="text-amber-500" />
  return <XCircle size={15} className="text-brand-950/35 dark:text-gray-500" />
}

function toneClasses(tone: PlatformMetric['tone']) {
  if (tone === 'gold') return 'border-[#D4AF37]/40 bg-[#D4AF37]/18 text-[#D4AF37]'
  if (tone === 'green') return 'border-emerald-400/35 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
  if (tone === 'amber') return 'border-amber-400/35 bg-amber-500/10 text-amber-600 dark:text-amber-300'
  return 'border-brand-300/35 bg-brand-50/70 text-brand-500 dark:border-brand-500/25 dark:bg-brand-900/20 dark:text-brand-200'
}

function SectionShell({ title, eyebrow, action, children, className = '' }: SectionShellProps) {
  return (
    <section className={`admin-card-surface overflow-hidden ${className}`}>
      <div className="flex flex-col gap-3 border-b border-brand-950/10 px-5 py-4 dark:border-dark-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          {eyebrow && (
            <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#D4AF37]">
              {eyebrow}
            </p>
          )}
          <h2 className="text-base font-black text-brand-950 dark:text-gray-100">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="page-enter space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="admin-card-surface p-6">
          <Skeleton className="mb-4 h-4 w-36" />
          <Skeleton className="mb-3 h-10 w-72" />
          <Skeleton className="mb-6 h-4 w-96 max-w-full" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
        <div className="admin-card-surface p-6">
          <Skeleton className="mb-5 h-5 w-40" />
          <Skeleton className="mb-3 h-12 w-full" />
          <Skeleton className="mb-3 h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="admin-card-surface p-5">
            <Skeleton className="mb-5 h-10 w-10" />
            <Skeleton className="mb-3 h-8 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  )
}

function TrendChart({ trend }: { trend: ActivityTrendPoint[] }) {
  const maxValue = Math.max(
    1,
    ...trend.flatMap((point) => [point.members, point.content, point.engagement, point.events]),
  )

  return (
    <div className="p-5">
      <div className="flex min-h-[260px] items-end gap-3 overflow-x-auto pb-2">
        {trend.map((point) => (
          <div key={point.key} className="flex min-w-[84px] flex-1 flex-col justify-end">
            <div className="mb-3 flex h-52 items-end gap-1.5 border-b border-brand-950/10 px-1 dark:border-white/10">
              {[
                { key: 'members', value: point.members, className: 'bg-[#D4AF37]' },
                { key: 'content', value: point.content, className: 'bg-brand-500 dark:bg-brand-300' },
                { key: 'engagement', value: point.engagement, className: 'bg-emerald-500' },
                { key: 'events', value: point.events, className: 'bg-amber-500/70' },
              ].map((bar) => (
                <div
                  key={bar.key}
                  className={`w-full min-w-2 ${bar.className}`}
                  style={{ height: `${Math.max(6, (bar.value / maxValue) * 100)}%` }}
                  title={`${bar.key}: ${bar.value}`}
                />
              ))}
            </div>
            <p className="text-center text-xs font-black uppercase tracking-[0.16em] text-brand-950/45 dark:text-gray-500">
              {point.label}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-2 text-xs font-bold text-brand-950/55 dark:text-gray-400 sm:grid-cols-4">
        <span className="flex items-center gap-2"><i className="h-2 w-5 bg-[#D4AF37]" /> Members</span>
        <span className="flex items-center gap-2"><i className="h-2 w-5 bg-brand-500 dark:bg-brand-300" /> Content</span>
        <span className="flex items-center gap-2"><i className="h-2 w-5 bg-emerald-500" /> Engagement</span>
        <span className="flex items-center gap-2"><i className="h-2 w-5 bg-amber-500/70" /> Events</span>
      </div>
    </div>
  )
}

function MoneyTrend({ trend }: { trend: ActivityTrendPoint[] }) {
  const maxValue = Math.max(1, ...trend.map((point) => point.donations))

  return (
    <div className="space-y-3">
      {trend.map((point) => (
        <div key={point.key} className="grid grid-cols-[2.5rem_1fr_5rem] items-center gap-3">
          <span className="text-xs font-black uppercase tracking-[0.14em] text-brand-950/45 dark:text-gray-500">
            {point.label}
          </span>
          <div className="h-3 bg-brand-950/10 dark:bg-white/10">
            <div
              className="h-full bg-[#D4AF37]"
              style={{ width: `${Math.max(4, (point.donations / maxValue) * 100)}%` }}
            />
          </div>
          <span className="text-right text-xs font-bold text-brand-950 dark:text-gray-200">
            {compact(point.donations)}
          </span>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ metric, onOpen }: { metric: PlatformMetric; onOpen: (path: string) => void }) {
  const Icon = metric.icon
  return (
    <RoleGate permission={metric.permission}>
      <motion.button
        type="button"
        onClick={() => onOpen(metric.path)}
        className="group admin-card-surface relative flex min-h-[168px] w-full flex-col overflow-hidden p-5 text-left transition-transform hover:-translate-y-0.5"
        whileHover={{ y: -2 }}
      >
        <div className="absolute right-0 top-0 h-24 w-24 bg-gradient-to-bl from-brand-100/45 to-transparent dark:from-brand-800/10" />
        <div className="relative z-10 flex items-start justify-between">
          <div className={`border p-3 ${toneClasses(metric.tone)}`}>
            <Icon size={22} />
          </div>
          <ArrowRight size={18} className="text-brand-950/28 transition-transform group-hover:translate-x-1 dark:text-gray-500" />
        </div>
        <div className="relative z-10 mt-auto">
          <p className="text-3xl font-black tracking-tight text-brand-950 dark:text-gray-100">{metric.value}</p>
          <p className="mt-1 text-sm font-black text-brand-950 dark:text-gray-100">{metric.label}</p>
          <p className="mt-2 text-sm leading-5 text-brand-950/55 dark:text-gray-400">{metric.caption}</p>
        </div>
      </motion.button>
    </RoleGate>
  )
}

function QueueButton({ item, onOpen }: { item: QueueItem; onOpen: (path: string) => void }) {
  const Icon = item.icon
  const tone =
    item.tone === 'danger'
      ? 'border-red-400/30 bg-red-500/10 text-red-600 dark:text-red-300'
      : item.tone === 'warning'
        ? 'border-amber-400/35 bg-amber-500/10 text-amber-600 dark:text-amber-300'
        : 'border-brand-300/30 bg-brand-50/60 text-brand-600 dark:border-brand-700/40 dark:bg-brand-900/20 dark:text-brand-200'

  return (
    <RoleGate permission={item.permission}>
      <button
        type="button"
        onClick={() => onOpen(item.path)}
        className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-brand-950/10 px-5 py-4 text-left transition-colors hover:bg-cream-100/65 dark:border-white/10 dark:hover:bg-white/[0.04]"
      >
        <span className={`flex h-11 w-11 items-center justify-center border ${tone}`}>
          <Icon size={18} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-black text-brand-950 dark:text-gray-100">{item.label}</span>
          <span className="mt-1 block text-xs leading-5 text-brand-950/50 dark:text-gray-400">{item.detail}</span>
        </span>
        <span className="flex items-center gap-3">
          <span className="text-2xl font-black text-brand-950 dark:text-gray-100">{compact(item.value)}</span>
          <ArrowRight size={16} className="text-brand-950/25 transition-transform group-hover:translate-x-1 dark:text-gray-500" />
        </span>
      </button>
    </RoleGate>
  )
}

function RingStat({ value, label, caption }: { value: number; label: string; caption: string }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid h-24 w-24 place-items-center border border-brand-950/10 dark:border-white/10"
        style={{
          background: `conic-gradient(#D4AF37 ${value}%, rgba(0, 27, 80, 0.1) 0)`,
        }}
      >
        <div className="grid h-[4.4rem] w-[4.4rem] place-items-center bg-cream-50 text-lg font-black text-brand-950 dark:bg-dark-card dark:text-gray-100">
          {value}%
        </div>
      </div>
      <div>
        <p className="font-black text-brand-950 dark:text-gray-100">{label}</p>
        <p className="mt-1 text-sm leading-5 text-brand-950/55 dark:text-gray-400">{caption}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { entries } = useActivityStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)

  useEffect(() => {
    let mounted = true

    client.get<ApiResponse<DashboardData>>('/admin/dashboard/stats')
      .then((res) => {
        if (!mounted) return
        setData(res.data.data ?? null)
        setLoadFailed(false)
      })
      .catch(() => {
        if (mounted) setLoadFailed(true)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  if (loading) return <DashboardSkeleton />

  const o = data?.overview ?? emptyOverview
  const trend = data?.activityTrend?.length ? data.activityTrend : emptyTrend()
  const financials = data?.financials ?? { donationsByChannel: [], duesByStatus: [] }
  const recentMembers = data?.recentMembers ?? []
  const recentDonations = data?.recentDonations ?? []
  const recentMessages = data?.recentMessages ?? []
  const recentJobs = data?.recentJobs ?? []
  const recentActivity = entries.slice(0, 5)
  const activeRate = percent(o.activeMembers, o.totalMembers)
  const projectFundingRate = percent(o.projectFundingRaised, o.projectFundingGoal)
  const openWorkCount = o.pendingApprovals + o.unreadMessagesCount + o.pendingJobs + o.pendingMentorshipRequests + o.pendingDonationsCount + o.pendingDuesCount + o.overdueDuesCount + o.pendingTranscriptRequestsCount
  const engagementTotal = o.totalForumPosts + o.totalForumComments + o.eventRsvpCount + o.pollVoteCount + o.electionVoteCount + o.totalJobApplications
  const contentTotal = o.publishedNewsCount + o.upcomingEventsCount + o.activeProjectsCount + o.galleryItemCount
  const today = new Date().toLocaleDateString('en-GH', { weekday: 'long', month: 'short', day: 'numeric' })
  const firstName = currentUser?.name?.split(' ')[0] ?? 'there'

  const platformMetrics: PlatformMetric[] = [
    {
      label: 'Membership desk',
      value: compact(o.totalMembers),
      caption: `${compact(o.activeMembers)} active, ${compact(o.pendingApprovals)} pending approval`,
      icon: Users,
      tone: 'blue',
      path: '/members',
      permission: 'members:view',
    },
    {
      label: 'Funding pulse',
      value: money(o.donationsTotal),
      caption: `${compact(o.confirmedDonationsCount)} confirmed gifts, ${compact(o.pendingDonationsCount)} pending`,
      icon: HandCoins,
      tone: 'gold',
      path: '/donations',
      permission: 'donations:view',
    },
    {
      label: 'Community reach',
      value: compact(engagementTotal),
      caption: `${compact(o.totalForumPosts)} posts, ${compact(o.eventRsvpCount)} RSVPs, ${compact(o.totalJobApplications)} job applications`,
      icon: Activity,
      tone: 'green',
      path: '/forum',
      permission: 'forum:view',
    },
    {
      label: 'Open work',
      value: compact(openWorkCount),
      caption: 'Registrations, messages, dues, jobs, transcripts, and mentorship requests',
      icon: AlertTriangle,
      tone: 'amber',
      path: '/alumni-registrations',
      permission: 'alumni:view',
    },
  ]

  const queueItems: QueueItem[] = [
    { label: 'Pending registrations', value: o.pendingApprovals, detail: 'Alumni waiting for approval', icon: UserCheck, path: '/alumni-registrations', permission: 'alumni:view', tone: o.pendingApprovals > 0 ? 'warning' : 'neutral' },
    { label: 'Unread contact messages', value: o.unreadMessagesCount, detail: 'Public enquiries needing reply', icon: Mail, path: '/contact-messages', permission: 'contact:view', tone: o.unreadMessagesCount > 0 ? 'danger' : 'neutral' },
    { label: 'Job posts to review', value: o.pendingJobs, detail: 'Submitted opportunities not yet approved', icon: Briefcase, path: '/jobs', permission: 'jobs:view', tone: o.pendingJobs > 0 ? 'warning' : 'neutral' },
    { label: 'Mentorship requests', value: o.pendingMentorshipRequests, detail: 'Relationship requests waiting on response', icon: Handshake, path: '/members', permission: 'members:view', tone: o.pendingMentorshipRequests > 0 ? 'warning' : 'neutral' },
    { label: 'Pending donations', value: o.pendingDonationsCount, detail: 'Manual or provider gifts to reconcile', icon: WalletCards, path: '/donations', permission: 'donations:view', tone: o.pendingDonationsCount > 0 ? 'warning' : 'neutral' },
    { label: 'Transcript requests', value: o.pendingTranscriptRequestsCount, detail: 'Service desk requests still open', icon: FileText, path: '/contact-messages', permission: 'contact:view', tone: o.pendingTranscriptRequestsCount > 0 ? 'warning' : 'neutral' },
  ]

  const actionCards: Array<{ label: string; detail: string; icon: ElementType; path: string; permission: Permission }> = [
    { label: 'Post news', detail: 'Publish an update, report, or announcement.', icon: Newspaper, path: '/news/new', permission: 'news:create' },
    { label: 'Create event', detail: 'Add upcoming gatherings and RSVP paths.', icon: Calendar, path: '/events/new', permission: 'events:create' },
    { label: 'Launch poll', detail: 'Start a quick member decision point.', icon: Vote, path: '/polls/new', permission: 'polls:create' },
    { label: 'Site config', detail: 'Update public website content blocks.', icon: Settings, path: '/site-config', permission: 'settings:edit' },
  ]

  const contentLanes: Array<{ label: string; value: number; icon: ElementType; path: string; permission: Permission }> = [
    { label: 'Published news', value: o.publishedNewsCount, icon: Newspaper, path: '/news', permission: 'news:view' },
    { label: 'Upcoming events', value: o.upcomingEventsCount, icon: Calendar, path: '/events', permission: 'events:view' },
    { label: 'Active projects', value: o.activeProjectsCount, icon: FolderKanban, path: '/projects', permission: 'projects:view' },
    { label: 'Gallery items', value: o.galleryItemCount, icon: Image, path: '/gallery', permission: 'content:view' },
    { label: 'Executives', value: o.activeExecutivesCount, icon: ShieldCheck, path: '/executives', permission: 'executives:view' },
    { label: 'Newsletter', value: o.newsletterSubscribers, icon: Send, path: '/newsletter', permission: 'settings:view' },
  ]

  const donationBuckets = financials.donationsByChannel.length
    ? financials.donationsByChannel
    : [{ channel: 'CONFIRMED', total: o.donationsTotal, count: o.confirmedDonationsCount }]
  const maxDonationBucket = Math.max(1, ...donationBuckets.map((bucket) => bucket.total))
  const duesBuckets = financials.duesByStatus.length
    ? financials.duesByStatus
    : [
        { status: 'PAID', total: o.paidDuesTotal, count: o.paidDuesCount },
        { status: 'PENDING', total: o.pendingDuesTotal, count: o.pendingDuesCount },
      ]

  return (
    <div className="page-enter space-y-6">
      <section className="relative overflow-hidden border border-white/10 bg-[#001B50] text-cream-100 shadow-[0_24px_80px_rgba(0,27,80,0.22)]">
        <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-96 w-96 object-contain opacity-[0.05]" />
        <img src="/logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute bottom-[-11rem] left-1/4 h-[28rem] w-[28rem] object-contain opacity-[0.035]" />
        <div className="relative grid gap-0 lg:grid-cols-[1.45fr_0.9fr]">
          <div className="border-b border-white/10 p-6 md:p-8 lg:border-b-0 lg:border-r">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              {currentUser ? ROLES[currentUser.role] : 'Admin desk'} / {today}
            </p>
            <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl">
              Good day, {firstName}. Here is the platform at a glance.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-cream-100/66">
              A live snapshot across alumni membership, content, donations, service queues, engagement, and governance.
            </p>
            {loadFailed && (
              <div className="mt-5 border border-amber-300/35 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-100">
                The latest snapshot could not be loaded. Showing empty dashboard structure.
              </div>
            )}
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="border border-white/10 bg-white/[0.04] p-4">
                <p className="text-2xl font-black text-[#D4AF37]">{activeRate}%</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-cream-100/48">Active member rate</p>
              </div>
              <div className="border border-white/10 bg-white/[0.04] p-4">
                <p className="text-2xl font-black text-[#D4AF37]">{compact(contentTotal)}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-cream-100/48">Public content items</p>
              </div>
              <div className="border border-white/10 bg-white/[0.04] p-4">
                <p className="text-2xl font-black text-[#D4AF37]">{compact(o.enabledPaymentMethodsCount)}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-cream-100/48">Enabled payment rails</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between p-6 md:p-8">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Priority command</p>
              <p className="mt-3 text-5xl font-black leading-none text-cream-100">{compact(openWorkCount)}</p>
              <p className="mt-3 text-sm leading-6 text-cream-100/62">Open items across approvals, messages, finances, jobs, transcripts, and mentorship.</p>
            </div>
            <div className="mt-8 grid gap-3">
              <RoleGate permission="alumni:view">
                <button onClick={() => navigate('/alumni-registrations')} className="group flex items-center justify-between border border-[#D4AF37]/40 bg-[#D4AF37] px-4 py-3 text-sm font-black text-[#001B50]">
                  Review queue <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </button>
              </RoleGate>
              <RoleGate permission="news:create">
                <button onClick={() => navigate('/news/new')} className="group flex items-center justify-between border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-black text-cream-100 transition-colors hover:bg-white/[0.1]">
                  Publish dispatch <PlusCircle size={17} className="transition-transform group-hover:rotate-90" />
                </button>
              </RoleGate>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {platformMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} onOpen={navigate} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <SectionShell
          title="Six-month platform rhythm"
          eyebrow="Time series"
          action={<span className="text-xs font-bold text-brand-950/45 dark:text-gray-500">Registrations, content, engagement, events</span>}
        >
          <TrendChart trend={trend} />
        </SectionShell>

        <SectionShell title="Operational queue" eyebrow="Admin workload">
          <div>
            {queueItems.map((item) => (
              <QueueButton key={item.label} item={item} onOpen={navigate} />
            ))}
          </div>
        </SectionShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.1fr_0.95fr]">
        <SectionShell title="Funding and dues" eyebrow="Money movement">
          <div className="space-y-6 p-5">
            <RingStat
              value={projectFundingRate}
              label={money(o.projectFundingRaised)}
              caption={`Raised against ${money(o.projectFundingGoal)} in project goals.`}
            />
            <div className="border-t border-brand-950/10 pt-5 dark:border-white/10">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-brand-950/45 dark:text-gray-500">Donation trend</p>
              <MoneyTrend trend={trend} />
            </div>
          </div>
        </SectionShell>

        <SectionShell title="Donation channel mix" eyebrow="Reconciliation">
          <div className="space-y-4 p-5">
            {donationBuckets.map((bucket) => (
              <div key={bucket.channel ?? bucket.status} className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-black text-brand-950 dark:text-gray-100">{bucket.channel ?? bucket.status}</span>
                  <span className="text-sm font-bold text-brand-950/55 dark:text-gray-400">{money(bucket.total)}</span>
                </div>
                <div className="h-3 bg-brand-950/10 dark:bg-white/10">
                  <div className="h-full bg-[#D4AF37]" style={{ width: `${Math.max(4, (bucket.total / maxDonationBucket) * 100)}%` }} />
                </div>
                <p className="text-xs text-brand-950/45 dark:text-gray-500">{compact(bucket.count)} transactions</p>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell title="Dues health" eyebrow="Member finance">
          <div className="space-y-3 p-5">
            {duesBuckets.map((bucket) => (
              <div key={bucket.status ?? bucket.channel} className="border border-brand-950/10 bg-cream-100/40 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-brand-950 dark:text-gray-100">{bucket.status ?? bucket.channel}</p>
                  <p className="text-lg font-black text-brand-950 dark:text-gray-100">{compact(bucket.count)}</p>
                </div>
                <p className="mt-3 text-sm text-brand-950/55 dark:text-gray-400">{money(bucket.total)}</p>
              </div>
            ))}
            <div className="border border-amber-400/30 bg-amber-500/10 p-4">
              <p className="text-sm font-black text-amber-700 dark:text-amber-300">{compact(o.overdueDuesCount)} overdue dues</p>
              <p className="mt-1 text-xs text-amber-700/70 dark:text-amber-200/70">Follow up from the dues workspace.</p>
            </div>
          </div>
        </SectionShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionShell title="Platform coverage" eyebrow="Modules live">
          <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
            {contentLanes.map((lane) => {
              const Icon = lane.icon
              return (
                <RoleGate key={lane.label} permission={lane.permission}>
                  <button
                    type="button"
                    onClick={() => navigate(lane.path)}
                    className="group flex min-h-[138px] flex-col border-b border-r border-brand-950/10 p-5 text-left transition-colors hover:bg-cream-100/70 dark:border-white/10 dark:hover:bg-white/[0.04]"
                  >
                    <div className="flex items-start justify-between">
                      <Icon size={20} className="text-[#D4AF37]" />
                      <ArrowRight size={15} className="text-brand-950/25 transition-transform group-hover:translate-x-1 dark:text-gray-500" />
                    </div>
                    <div className="mt-auto">
                      <p className="text-2xl font-black text-brand-950 dark:text-gray-100">{compact(lane.value)}</p>
                      <p className="mt-1 text-sm font-bold text-brand-950/55 dark:text-gray-400">{lane.label}</p>
                    </div>
                  </button>
                </RoleGate>
              )
            })}
          </div>
        </SectionShell>

        <SectionShell title="Quick action board" eyebrow="Next moves">
          <div className="grid gap-3 p-5">
            {actionCards.map((action) => {
              const Icon = action.icon
              return (
                <RoleGate key={action.label} permission={action.permission}>
                  <button
                    type="button"
                    onClick={() => navigate(action.path)}
                    className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 border border-brand-950/10 bg-cream-100/45 p-4 text-left transition-colors hover:bg-cream-100 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center bg-[#D4AF37]/20 text-[#D4AF37]">
                      <Icon size={18} />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-brand-950 dark:text-gray-100">{action.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-brand-950/50 dark:text-gray-400">{action.detail}</span>
                    </span>
                    <ArrowRight size={16} className="text-brand-950/25 transition-transform group-hover:translate-x-1 dark:text-gray-500" />
                  </button>
                </RoleGate>
              )
            })}
          </div>
        </SectionShell>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <SectionShell
          title="Recent registrations"
          eyebrow="Membership"
          action={<button onClick={() => navigate('/alumni-registrations')} className="text-xs font-black text-brand-600 hover:underline dark:text-brand-300">View all</button>}
        >
          <div className="divide-y divide-brand-950/10 dark:divide-white/10">
            {recentMembers.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center px-5 py-10 text-center">
                <Inbox size={28} className="mb-3 text-brand-950/30 dark:text-gray-500" />
                <p className="text-sm font-bold text-brand-950/55 dark:text-gray-400">No recent registrations.</p>
              </div>
            ) : recentMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 px-5 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-brand-100 text-xs font-black text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
                  {member.fullName.split(' ').map((name) => name[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-brand-950 dark:text-gray-100">{member.fullName}</p>
                  <p className="truncate text-xs text-brand-950/45 dark:text-gray-500">{member.email}</p>
                </div>
                {statusIcon(member.membershipStatus)}
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          title="Recent giving"
          eyebrow="Donations"
          action={<button onClick={() => navigate('/donations')} className="text-xs font-black text-brand-600 hover:underline dark:text-brand-300">View all</button>}
        >
          <div className="divide-y divide-brand-950/10 dark:divide-white/10">
            {recentDonations.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center px-5 py-10 text-center">
                <HandCoins size={28} className="mb-3 text-brand-950/30 dark:text-gray-500" />
                <p className="text-sm font-bold text-brand-950/55 dark:text-gray-400">No confirmed gifts yet.</p>
              </div>
            ) : recentDonations.map((donation, index) => (
              <div key={`${donation.donorName}-${index}`} className="flex items-center gap-3 px-5 py-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  <HandCoins size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-brand-950 dark:text-gray-100">{donation.donorName}</p>
                  <p className="text-xs text-brand-950/45 dark:text-gray-500">{formatTimeAgo(donation.createdAt)}</p>
                </div>
                <p className="text-sm font-black text-emerald-600 dark:text-emerald-300">{money(donation.amount, donation.currency)}</p>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell title="Recent operations" eyebrow="Service desk">
          <div className="divide-y divide-brand-950/10 dark:divide-white/10">
            {recentMessages.slice(0, 3).map((message) => (
              <button key={message.id} onClick={() => navigate('/contact-messages')} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 text-left hover:bg-cream-100/60 dark:hover:bg-white/[0.04]">
                <span className="grid h-10 w-10 place-items-center bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
                  <Mail size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-brand-950 dark:text-gray-100">{message.subject}</span>
                  <span className="block truncate text-xs text-brand-950/45 dark:text-gray-500">{message.name} / {formatTimeAgo(message.createdAt)}</span>
                </span>
                {!message.isRead && <span className="h-2.5 w-2.5 bg-[#D4AF37]" />}
              </button>
            ))}
            {recentJobs.slice(0, 2).map((job) => (
              <button key={job.id} onClick={() => navigate('/jobs')} className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 text-left hover:bg-cream-100/60 dark:hover:bg-white/[0.04]">
                <span className="grid h-10 w-10 place-items-center bg-amber-500/10 text-amber-600 dark:text-amber-300">
                  <Briefcase size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-brand-950 dark:text-gray-100">{job.title}</span>
                  <span className="block truncate text-xs text-brand-950/45 dark:text-gray-500">{job.company} / {formatTimeAgo(job.createdAt)}</span>
                </span>
                <ArrowRight size={14} className="text-brand-950/25 dark:text-gray-500" />
              </button>
            ))}
            {recentMessages.length === 0 && recentJobs.length === 0 && (
              <div className="flex min-h-48 flex-col items-center justify-center px-5 py-10 text-center">
                <MessageSquare size={28} className="mb-3 text-brand-950/30 dark:text-gray-500" />
                <p className="text-sm font-bold text-brand-950/55 dark:text-gray-400">No service activity yet.</p>
              </div>
            )}
          </div>
        </SectionShell>
      </div>

      <SectionShell title="Local admin activity" eyebrow="This browser session">
        {recentActivity.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center px-5 py-10 text-center">
            <Activity size={28} className="mb-3 text-brand-950/30 dark:text-gray-500" />
            <p className="text-sm font-bold text-brand-950/55 dark:text-gray-400">Actions you take in this session will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-0 md:grid-cols-2">
            {recentActivity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 border-b border-r border-brand-950/10 px-5 py-4 dark:border-white/10">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 bg-[#D4AF37]" />
                <div className="min-w-0">
                  <p className="text-sm text-brand-950/70 dark:text-gray-300">
                    <span className="font-black text-brand-950 dark:text-gray-100">{entry.performedByName}</span> {entry.action}
                  </p>
                  <p className="mt-1 text-xs text-brand-950/40 dark:text-gray-500">{formatTimeAgo(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionShell>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="admin-card-surface p-5">
          <Megaphone size={20} className="mb-5 text-[#D4AF37]" />
          <p className="text-2xl font-black text-brand-950 dark:text-gray-100">{compact(o.draftNewsCount)}</p>
          <p className="mt-1 text-sm font-bold text-brand-950/50 dark:text-gray-400">Draft dispatches</p>
        </div>
        <div className="admin-card-surface p-5">
          <BarChart3 size={20} className="mb-5 text-[#D4AF37]" />
          <p className="text-2xl font-black text-brand-950 dark:text-gray-100">{compact(o.activePolls)}</p>
          <p className="mt-1 text-sm font-bold text-brand-950/50 dark:text-gray-400">Active polls</p>
        </div>
        <div className="admin-card-surface p-5">
          <Target size={20} className="mb-5 text-[#D4AF37]" />
          <p className="text-2xl font-black text-brand-950 dark:text-gray-100">{compact(o.activeElections)}</p>
          <p className="mt-1 text-sm font-bold text-brand-950/50 dark:text-gray-400">Active elections</p>
        </div>
        <div className="admin-card-surface p-5">
          <ShieldCheck size={20} className="mb-5 text-[#D4AF37]" />
          <p className="text-2xl font-black text-brand-950 dark:text-gray-100">{compact(o.activeAdmins)} / {compact(o.totalAdmins)}</p>
          <p className="mt-1 text-sm font-bold text-brand-950/50 dark:text-gray-400">Active admins</p>
        </div>
      </div>
    </div>
  )
}
