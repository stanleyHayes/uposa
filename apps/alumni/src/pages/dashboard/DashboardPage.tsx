import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Briefcase,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Flame,
  Gift,
  Handshake,
  Heart,
  MapPin,
  MessageSquare,
  Newspaper,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Vote,
  WalletCards,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import ScrollReveal from '../../components/common/ScrollReveal'
import StaggerChildren, { StaggerItem } from '../../components/common/StaggerChildren'
import Avatar from '../../components/ui/Avatar'
import { Card } from '../../components/ui/Card'
import { useAuthStore } from '../../stores/auth.store'
import {
  donationsApi,
  duesApi,
  electionsApi,
  eventsApi,
  forumApi,
  jobsApi,
  mentorshipApi,
  newsApi,
  paymentMethodsApi,
  pollsApi,
  projectsApi,
} from '../../api/services'
import { formatCurrency, formatDate, timeAgo } from '../../utils/formatters'
import type {
  Donation,
  Due,
  Election,
  Event,
  ForumPost,
  Job,
  MentorshipRequest,
  News,
  PaymentMethod,
  Poll,
  Project,
} from '../../types'

interface SectionProps {
  title: string
  eyebrow: string
  icon: LucideIcon
  action?: ReactNode
  children: ReactNode
  className?: string
}

interface MetricCardProps {
  icon: LucideIcon
  label: string
  value: string
  detail: string
  tone: 'gold' | 'blue' | 'green' | 'amber'
  to: string
}

interface QueueItem {
  icon: LucideIcon
  title: string
  detail: string
  value: string
  to: string
  tone: 'warning' | 'gold' | 'blue' | 'green'
}

interface TrendPoint {
  key: string
  label: string
  giving: number
  dues: number
  engagement: number
  events: number
}

interface ActivityItem {
  key: string
  title: string
  detail: string
  to: string
  date: string
  icon: LucideIcon
}

function compact(value: number) {
  return new Intl.NumberFormat('en', {
    notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

function compactMoney(value: number, currency = 'GHS') {
  return `${currency} ${compact(value)}`
}

function percent(value: number, total: number) {
  if (!total) return 0
  return Math.min(100, Math.round((value / total) * 100))
}

function safeDate(value?: string | Date) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`
}

function emptyTrend(): TrendPoint[] {
  const now = new Date()
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    return {
      key: monthKey(date),
      label: date.toLocaleDateString('en', { month: 'short' }),
      giving: 0,
      dues: 0,
      engagement: 0,
      events: 0,
    }
  })
}

function buildTrend({
  donations,
  dues,
  forumPosts,
  events,
  news,
}: {
  donations: Donation[]
  dues: Due[]
  forumPosts: ForumPost[]
  events: Event[]
  news: News[]
}) {
  const points = emptyTrend()
  const index = new Map(points.map((point) => [point.key, point]))

  donations.forEach((donation) => {
    const date = safeDate(donation.createdAt)
    const point = date ? index.get(monthKey(date)) : null
    if (point && donation.status !== 'FAILED') point.giving += donation.amount
  })

  dues.forEach((due) => {
    const date = safeDate(due.paidAt || due.updatedAt || due.createdAt)
    const point = date ? index.get(monthKey(date)) : null
    if (point && due.status === 'PAID') point.dues += due.amount
  })

  forumPosts.forEach((post) => {
    const date = safeDate(post.createdAt)
    const point = date ? index.get(monthKey(date)) : null
    if (point) point.engagement += 1 + (post._count?.comments || 0)
  })

  news.forEach((item) => {
    const date = safeDate(item.publishedAt || item.createdAt)
    const point = date ? index.get(monthKey(date)) : null
    if (point) point.engagement += 1
  })

  events.forEach((event) => {
    const date = safeDate(event.date)
    const point = date ? index.get(monthKey(date)) : null
    if (point) point.events += 1
  })

  return points
}

function toneClasses(tone: MetricCardProps['tone']) {
  if (tone === 'gold') return 'border-secondary/40 bg-secondary/16 text-secondary'
  if (tone === 'green') return 'border-success/30 bg-success/10 text-success'
  if (tone === 'amber') return 'border-warning/35 bg-warning/10 text-warning'
  return 'border-primary/20 bg-primary/8 text-primary'
}

function SectionPanel({ title, eyebrow, icon: Icon, action, children, className }: SectionProps) {
  return (
    <Card hover={false} className={`h-full ${className || ''}`}>
      <div className="h-1 bg-secondary" />
      <div className="flex flex-col gap-3 border-b border-primary/10 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center border border-secondary/30 bg-secondary/14 text-secondary">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">{eyebrow}</p>
            <h2 className="mt-1 text-lg font-bold leading-tight text-base-content">{title}</h2>
          </div>
        </div>
        {action}
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </Card>
  )
}

function EmptyPanel({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center border border-primary/10 bg-base-200/35 px-5 py-8 text-center">
      <Icon className="mb-3 h-8 w-8 text-base-content/25" />
      <p className="font-bold">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-relaxed text-base-content/52">{description}</p>
    </div>
  )
}

function ListSkeleton({ rows = 3, withMedia = false }: { rows?: number; withMedia?: boolean }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-3 border border-primary/10 bg-base-100/65 p-3">
          {withMedia && <div className="skeleton h-14 w-16 shrink-0" />}
          <div className="flex-1 space-y-2 py-1">
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ metric }: { metric: MetricCardProps }) {
  const Icon = metric.icon

  return (
    <Link to={metric.to} className="group block h-full">
      <Card hover={false} className="flex h-full min-h-[170px] flex-col p-5 transition-transform group-hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-4">
          <span className={`grid h-12 w-12 place-items-center border ${toneClasses(metric.tone)}`}>
            <Icon className="h-5 w-5" />
          </span>
          <ArrowRight className="h-5 w-5 text-base-content/25 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
        </div>
        <div className="mt-auto pt-6">
          <p className="text-3xl font-bold leading-none text-base-content">{metric.value}</p>
          <p className="mt-2 text-sm font-bold text-base-content">{metric.label}</p>
          <p className="mt-2 text-sm leading-5 text-base-content/55">{metric.detail}</p>
        </div>
      </Card>
    </Link>
  )
}

function TrendChart({ trend }: { trend: TrendPoint[] }) {
  const maxValue = Math.max(
    1,
    ...trend.flatMap((point) => [point.giving, point.dues, point.engagement, point.events]),
  )

  return (
    <div>
      <div className="flex min-h-[250px] items-end gap-3 overflow-x-auto pb-2">
        {trend.map((point) => (
          <div key={point.key} className="flex min-w-[78px] flex-1 flex-col justify-end">
            <div className="mb-3 flex h-48 items-end gap-1.5 border-b border-primary/10 px-1">
              {[
                { key: 'giving', value: point.giving, className: 'bg-secondary' },
                { key: 'dues', value: point.dues, className: 'bg-primary' },
                { key: 'engagement', value: point.engagement, className: 'bg-success' },
                { key: 'events', value: point.events, className: 'bg-warning' },
              ].map((bar) => (
                <div
                  key={bar.key}
                  className={`w-full min-w-2 ${bar.className}`}
                  style={{ height: `${Math.max(6, (bar.value / maxValue) * 100)}%` }}
                  title={`${bar.key}: ${bar.value}`}
                />
              ))}
            </div>
            <p className="text-center text-xs font-bold uppercase tracking-[0.16em] text-base-content/45">{point.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-2 text-xs font-bold text-base-content/55 sm:grid-cols-4">
        <span className="flex items-center gap-2"><i className="h-2 w-5 bg-secondary" /> Giving</span>
        <span className="flex items-center gap-2"><i className="h-2 w-5 bg-primary" /> Dues paid</span>
        <span className="flex items-center gap-2"><i className="h-2 w-5 bg-success" /> Engagement</span>
        <span className="flex items-center gap-2"><i className="h-2 w-5 bg-warning" /> Events</span>
      </div>
    </div>
  )
}

function RingStat({ value, title, detail }: { value: number; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="grid h-24 w-24 shrink-0 place-items-center border border-primary/10"
        style={{ background: `conic-gradient(#D4AF37 ${value}%, rgba(0, 27, 80, 0.1) 0)` }}
      >
        <div className="grid h-[4.4rem] w-[4.4rem] place-items-center bg-base-100 text-lg font-bold text-primary">
          {value}%
        </div>
      </div>
      <div>
        <p className="font-bold text-base-content">{title}</p>
        <p className="mt-1 text-sm leading-5 text-base-content/55">{detail}</p>
      </div>
    </div>
  )
}

function QueueButton({ item }: { item: QueueItem }) {
  const Icon = item.icon
  const tone =
    item.tone === 'warning'
      ? 'border-warning/35 bg-warning/10 text-warning'
      : item.tone === 'green'
        ? 'border-success/30 bg-success/10 text-success'
        : item.tone === 'gold'
          ? 'border-secondary/40 bg-secondary/15 text-secondary'
          : 'border-primary/20 bg-primary/8 text-primary'

  return (
    <Link
      to={item.to}
      className="group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-primary/10 px-5 py-4 text-left transition-colors hover:bg-base-200/60"
    >
      <span className={`flex h-11 w-11 items-center justify-center border ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-base-content">{item.title}</span>
        <span className="mt-1 block text-xs leading-5 text-base-content/50">{item.detail}</span>
      </span>
      <span className="flex items-center gap-3">
        <span className="text-lg font-bold text-base-content">{item.value}</span>
        <ArrowRight className="h-4 w-4 text-base-content/25 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = item.icon

  return (
    <Link to={item.to} className="group flex items-center gap-3 border-b border-primary/10 px-5 py-4 transition-colors hover:bg-base-200/55">
      <span className="grid h-10 w-10 shrink-0 place-items-center border border-primary/10 bg-primary/6 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-base-content">{item.title}</span>
        <span className="mt-1 block truncate text-xs text-base-content/50">{item.detail}</span>
      </span>
      <span className="text-xs font-bold text-base-content/38">{timeAgo(item.date)}</span>
    </Link>
  )
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [events, setEvents] = useState<Event[]>([])
  const [news, setNews] = useState<News[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [dues, setDues] = useState<Due[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([])
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([])
  const [elections, setElections] = useState<Election[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const [
        eventsRes,
        newsRes,
        pollsRes,
        duesRes,
        donationsRes,
        projectsRes,
        jobsRes,
        mentorshipRes,
        forumRes,
        electionsRes,
        paymentMethodsRes,
      ] = await Promise.allSettled([
        eventsApi.upcoming(),
        newsApi.list({ limit: 5 }),
        pollsApi.list({ limit: 5 }),
        duesApi.my(),
        donationsApi.my(),
        projectsApi.ongoing(),
        jobsApi.list({ limit: 5 }),
        mentorshipApi.myRequests(),
        forumApi.posts({ limit: 6 }),
        electionsApi.list({ limit: 4 }),
        paymentMethodsApi.list(),
      ])

      if (!mounted) return
      setEvents(eventsRes.status === 'fulfilled' ? eventsRes.value.data.data?.slice(0, 4) || [] : [])
      setNews(newsRes.status === 'fulfilled' ? newsRes.value.data.data || [] : [])
      setPolls(pollsRes.status === 'fulfilled' ? pollsRes.value.data.data || [] : [])
      setDues(duesRes.status === 'fulfilled' ? duesRes.value.data.data || [] : [])
      setDonations(donationsRes.status === 'fulfilled' ? donationsRes.value.data.data || [] : [])
      setProjects(projectsRes.status === 'fulfilled' ? projectsRes.value.data.data?.slice(0, 4) || [] : [])
      setJobs(jobsRes.status === 'fulfilled' ? jobsRes.value.data.data || [] : [])
      setMentorshipRequests(mentorshipRes.status === 'fulfilled' ? mentorshipRes.value.data.data || [] : [])
      setForumPosts(forumRes.status === 'fulfilled' ? forumRes.value.data.data || [] : [])
      setElections(electionsRes.status === 'fulfilled' ? electionsRes.value.data.data || [] : [])
      setPaymentMethods(paymentMethodsRes.status === 'fulfilled' ? paymentMethodsRes.value.data.data || [] : [])
      setLoading(false)
    }

    load().catch(() => {
      if (!mounted) return
      setLoading(false)
    })

    return () => {
      mounted = false
    }
  }, [])

  const pendingDues = dues.filter((due) => due.status !== 'PAID')
  const paidDues = dues.filter((due) => due.status === 'PAID')
  const overdueDues = dues.filter((due) => due.status === 'OVERDUE')
  const pendingDuesTotal = pendingDues.reduce((sum, due) => sum + due.amount, 0)
  const paidDuesTotal = paidDues.reduce((sum, due) => sum + due.amount, 0)
  const duesTotal = dues.reduce((sum, due) => sum + due.amount, 0)
  const duesRate = percent(paidDuesTotal, duesTotal)
  const activePolls = polls.filter((poll) => poll.status === 'ACTIVE')
  const pollsAwaitingVote = activePolls.filter((poll) => !poll.hasVoted)
  const activeElections = elections.filter((election) => election.status === 'ACTIVE')
  const electionsAwaitingVote = activeElections.filter((election) => !election.hasVoted)
  const confirmedDonations = donations.filter((donation) => donation.status === 'CONFIRMED')
  const totalDonated = donations.reduce((sum, donation) => donation.status === 'FAILED' ? sum : sum + donation.amount, 0)
  const projectGoal = projects.reduce((sum, project) => sum + project.goalAmount, 0)
  const projectRaised = projects.reduce((sum, project) => sum + project.raisedAmount, 0)
  const projectRate = percent(projectRaised, projectGoal)
  const forumReplies = forumPosts.reduce((sum, post) => sum + (post._count?.comments || 0), 0)
  const openMentorship = mentorshipRequests.filter((request) => request.status === 'PENDING')
  const acceptedMentorship = mentorshipRequests.filter((request) => request.status === 'ACCEPTED')
  const firstName = user?.fullName?.split(' ')[0] || 'Member'

  const trend = useMemo(
    () => buildTrend({ donations, dues, forumPosts, events, news }),
    [donations, dues, forumPosts, events, news],
  )

  const metrics: MetricCardProps[] = [
    {
      icon: CreditCard,
      label: 'Dues health',
      value: pendingDues.length ? compactMoney(pendingDuesTotal) : 'Clear',
      detail: pendingDues.length ? `${pendingDues.length} open dues, ${overdueDues.length} overdue` : `${compactMoney(paidDuesTotal)} paid across your records`,
      tone: pendingDues.length ? 'amber' : 'green',
      to: '/dues',
    },
    {
      icon: Gift,
      label: 'Giving pulse',
      value: compactMoney(totalDonated),
      detail: `${confirmedDonations.length} confirmed gifts recorded on your account`,
      tone: 'gold',
      to: '/donations',
    },
    {
      icon: Flame,
      label: 'Community pulse',
      value: compact(forumPosts.length + forumReplies),
      detail: `${forumPosts.length} threads and ${forumReplies} replies in view`,
      tone: 'blue',
      to: '/forum',
    },
    {
      icon: Vote,
      label: 'Decisions',
      value: compact(pollsAwaitingVote.length + electionsAwaitingVote.length),
      detail: `${activePolls.length} active polls, ${activeElections.length} active elections`,
      tone: 'green',
      to: pollsAwaitingVote.length ? '/polls' : '/elections',
    },
  ]

  const quickLinks = [
    { to: '/dues', label: 'Pay dues', icon: CreditCard, tone: 'bg-secondary text-primary' },
    { to: '/donations', label: 'Donate', icon: Heart, tone: 'bg-primary text-primary-content' },
    { to: '/events', label: 'Events', icon: Calendar, tone: 'bg-accent text-accent-content' },
    { to: '/members', label: 'Directory', icon: Users, tone: 'bg-secondary text-primary' },
    { to: '/mentorship', label: 'Mentors', icon: Handshake, tone: 'bg-primary text-primary-content' },
    { to: '/jobs', label: 'Jobs', icon: Briefcase, tone: 'bg-accent text-accent-content' },
    { to: '/forum', label: 'Forum', icon: MessageSquare, tone: 'bg-secondary text-primary' },
    { to: '/profile', label: 'Profile', icon: ShieldCheck, tone: 'bg-primary text-primary-content' },
  ]

  const queueItems: QueueItem[] = [
    {
      icon: CreditCard,
      title: 'Dues to settle',
      detail: pendingDues.length ? 'Start a dues payment from your member finance desk.' : 'No dues currently require action.',
      value: pendingDues.length ? compactMoney(pendingDuesTotal) : 'Clear',
      to: '/dues',
      tone: pendingDues.length ? 'warning' : 'green',
    },
    {
      icon: Vote,
      title: 'Decisions awaiting you',
      detail: 'Polls and elections where your vote still matters.',
      value: compact(pollsAwaitingVote.length + electionsAwaitingVote.length),
      to: pollsAwaitingVote.length ? '/polls' : '/elections',
      tone: pollsAwaitingVote.length || electionsAwaitingVote.length ? 'gold' : 'blue',
    },
    {
      icon: Calendar,
      title: 'Upcoming gatherings',
      detail: 'Events available for planning, RSVP, and attendance.',
      value: compact(events.length),
      to: '/events',
      tone: 'blue',
    },
    {
      icon: Handshake,
      title: 'Mentorship desk',
      detail: `${acceptedMentorship.length} accepted relationships and ${openMentorship.length} pending requests.`,
      value: compact(openMentorship.length),
      to: '/mentorship/requests',
      tone: openMentorship.length ? 'warning' : 'green',
    },
    {
      icon: Briefcase,
      title: 'Jobs board',
      detail: 'Fresh opportunities shared through the alumni network.',
      value: compact(jobs.length),
      to: '/jobs',
      tone: 'blue',
    },
  ]

  const platformLanes = [
    { label: 'Events', value: events.length, icon: Calendar, to: '/events' },
    { label: 'News', value: news.length, icon: Newspaper, to: '/news' },
    { label: 'Projects', value: projects.length, icon: Target, to: '/projects' },
    { label: 'Jobs', value: jobs.length, icon: Briefcase, to: '/jobs' },
    { label: 'Forum threads', value: forumPosts.length, icon: MessageSquare, to: '/forum' },
    { label: 'Payment rails', value: paymentMethods.length, icon: WalletCards, to: '/donations' },
  ]

  const recentActivity: ActivityItem[] = [
    ...news.map((item) => ({
      key: `news-${item.id}`,
      title: item.title,
      detail: 'Latest dispatch',
      to: `/news/${item.slug}`,
      date: item.publishedAt || item.createdAt,
      icon: Newspaper,
    })),
    ...events.map((event) => ({
      key: `event-${event.id}`,
      title: event.title,
      detail: event.location || 'Event location pending',
      to: `/events/${event.slug}`,
      date: event.date,
      icon: Calendar,
    })),
    ...donations.map((donation) => ({
      key: `donation-${donation.id}`,
      title: `${formatCurrency(donation.amount, donation.currency)} donation`,
      detail: donation.status === 'CONFIRMED' ? 'Confirmed gift' : `${donation.status.toLowerCase()} gift`,
      to: '/donations',
      date: donation.createdAt,
      icon: Gift,
    })),
    ...forumPosts.map((post) => ({
      key: `forum-${post.id}`,
      title: post.title,
      detail: `${post._count?.comments || 0} replies`,
      to: `/forum/${post.slug}`,
      date: post.createdAt,
      icon: MessageSquare,
    })),
  ]
    .filter((item) => Boolean(safeDate(item.date)))
    .sort((a, b) => (safeDate(b.date)?.getTime() || 0) - (safeDate(a.date)?.getTime() || 0))
    .slice(0, 7)

  const primaryProject = projects[0]

  return (
    <PageTransition>
      <div className="relative space-y-6">
        <img
          src="/logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none fixed right-[-8rem] top-24 z-0 hidden h-[26rem] w-[26rem] object-contain opacity-[0.025] xl:block"
        />

        <ScrollReveal>
          <section className="relative z-10 overflow-hidden border border-primary/10 bg-primary text-primary-content shadow-[0_24px_80px_rgba(0,27,80,0.18)]">
            <img
              src="/logo.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-16 h-72 w-72 object-contain opacity-[0.055]"
            />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/75 to-transparent" />

            <div className="relative grid gap-0 lg:grid-cols-[minmax(0,1.28fr)_minmax(320px,0.72fr)]">
              <div className="border-b border-primary-content/10 p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <motion.div
                    initial={{ scale: 0.88, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                  >
                    <Avatar src={user?.photoUrl} name={user?.fullName || 'User'} size="xl" className="ring-4 ring-primary-content/12" />
                  </motion.div>
                  <div className="min-w-0">
                    <div className="mb-3 inline-flex items-center gap-2 border border-primary-content/15 bg-primary-content/10 px-3 py-2 text-xs font-semibold text-primary-content/70">
                      <Sparkles className="h-4 w-4 text-secondary" />
                      Member command center
                    </div>
                    <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                      Welcome back, {firstName}. Here is your UPOSA snapshot.
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primary-content/64 sm:text-base">
                      A live member view across dues, giving, decisions, events, projects, mentorship, jobs, and community conversations.
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="border border-primary-content/10 bg-primary-content/[0.06] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-content/42">Year group</p>
                    <p className="mt-2 text-lg font-bold text-secondary">{user?.yearGroup || 'Pending'}</p>
                  </div>
                  <div className="border border-primary-content/10 bg-primary-content/[0.06] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-content/42">House</p>
                    <p className="mt-2 text-lg font-bold text-secondary">{user?.house ? `${user.house} House` : 'Not set'}</p>
                  </div>
                  <div className="border border-primary-content/10 bg-primary-content/[0.06] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-content/42">Member since</p>
                    <p className="mt-2 text-lg font-bold text-secondary">{user?.createdAt ? formatDate(user.createdAt, 'MMM yyyy') : 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between gap-5 p-5 sm:p-7 lg:p-8">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">Priority command</p>
                  <p className="mt-3 text-5xl font-bold leading-none text-primary-content">
                    {pendingDues.length ? compactMoney(pendingDuesTotal) : 'Clear'}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-primary-content/62">
                    {pendingDues.length
                      ? `${pendingDues.length} dues item${pendingDues.length === 1 ? '' : 's'} need attention.`
                      : 'No outstanding dues are blocking your member desk.'}
                  </p>
                </div>
                <div className="grid gap-3">
                  <Link to={pendingDues.length > 0 ? '/dues' : '/donations'} className="btn btn-brand-gold h-12 justify-between px-5 text-base">
                    {pendingDues.length > 0 ? 'Settle dues' : 'Give now'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/profile" className="btn h-12 justify-between border-primary-content/12 bg-primary-content/[0.06] px-5 text-base text-primary-content hover:bg-primary-content/[0.1]">
                    Review profile
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>

        <StaggerChildren className="relative z-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <StaggerItem key={metric.label}>
              <MetricCard metric={metric} />
            </StaggerItem>
          ))}
        </StaggerChildren>

        <StaggerChildren className="relative z-10 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8" staggerDelay={0.04}>
          {quickLinks.map((link) => (
            <StaggerItem key={link.to}>
              <Link
                to={link.to}
                className="group flex min-h-28 flex-col justify-between border border-primary/10 bg-base-100/82 p-3 transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_14px_34px_rgba(0,27,80,0.09)]"
              >
                <span className={`grid h-11 w-11 place-items-center ${link.tone}`}>
                  <link.icon className="h-5 w-5" />
                </span>
                <span className="flex items-center justify-between gap-2 text-sm font-bold text-base-content">
                  {link.label}
                  <ArrowRight className="h-3.5 w-3.5 text-base-content/32 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>

        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.85fr)]">
          <SectionPanel
            icon={BarChart3}
            eyebrow="Time series"
            title="Six-month member rhythm"
            action={<span className="text-xs font-bold text-base-content/45">Giving, dues, engagement, events</span>}
          >
            <TrendChart trend={trend} />
          </SectionPanel>

          <SectionPanel icon={AlertCircle} eyebrow="Member workload" title="Priority queue">
            <div className="-mx-5 -my-5 sm:-mx-6">
              {queueItems.map((item) => (
                <QueueButton key={item.title} item={item} />
              ))}
            </div>
          </SectionPanel>
        </div>

        <div className="relative z-10 grid gap-6 xl:grid-cols-[0.9fr_1.1fr_1fr]">
          <SectionPanel icon={CreditCard} eyebrow="Member finance" title="Dues and payment health">
            <div className="space-y-6">
              <RingStat
                value={duesRate}
                title={`${compactMoney(paidDuesTotal)} paid`}
                detail={dues.length ? `${compactMoney(pendingDuesTotal)} still pending across ${pendingDues.length} records.` : 'Dues assigned to your account will appear here.'}
              />
              <div className="grid gap-3 border-t border-primary/10 pt-5 sm:grid-cols-2 xl:grid-cols-1">
                <Link to="/dues" className="group flex items-center justify-between border border-primary/10 bg-base-200/45 px-4 py-3 text-sm font-bold">
                  Start dues payment <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link to="/donations" className="group flex items-center justify-between border border-secondary/35 bg-secondary/14 px-4 py-3 text-sm font-bold text-primary">
                  Make a donation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          </SectionPanel>

          <SectionPanel icon={Target} eyebrow="School support" title="Project funding snapshot">
            {primaryProject ? (
              <div className="space-y-5">
                <div>
                  <p className="text-xl font-bold leading-tight text-base-content">{primaryProject.title}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-base-content/55">{primaryProject.description}</p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-base-content/55">
                    <span>{compactMoney(primaryProject.raisedAmount)} raised</span>
                    <span>{percent(primaryProject.raisedAmount, primaryProject.goalAmount)}%</span>
                  </div>
                  <div className="h-3 bg-base-300">
                    <div className="h-full bg-secondary" style={{ width: `${percent(primaryProject.raisedAmount, primaryProject.goalAmount)}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-base-content/45">Goal: {compactMoney(primaryProject.goalAmount)}</p>
                </div>
                <div className="grid gap-3 border-t border-primary/10 pt-5 sm:grid-cols-2">
                  <div className="border border-primary/10 bg-base-200/38 p-4">
                    <p className="text-2xl font-bold text-base-content">{projectRate}%</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-base-content/45">All active projects</p>
                  </div>
                  <div className="border border-primary/10 bg-base-200/38 p-4">
                    <p className="text-2xl font-bold text-base-content">{compactMoney(projectRaised)}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-base-content/45">Raised total</p>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyPanel icon={Target} title="No active projects" description="Published school support projects will appear here when they are open." />
            )}
          </SectionPanel>

          <SectionPanel icon={Rocket} eyebrow="Platform coverage" title="Your alumni modules">
            <div className="grid gap-0 border border-primary/10 sm:grid-cols-2">
              {platformLanes.map((lane) => {
                const Icon = lane.icon
                return (
                  <Link key={lane.label} to={lane.to} className="group flex min-h-28 flex-col border-b border-r border-primary/10 p-4 transition-colors hover:bg-base-200/55">
                    <div className="flex items-start justify-between">
                      <Icon className="h-5 w-5 text-secondary" />
                      <ArrowRight className="h-4 w-4 text-base-content/25 transition-transform group-hover:translate-x-1" />
                    </div>
                    <div className="mt-auto">
                      <p className="text-2xl font-bold text-base-content">{compact(lane.value)}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-base-content/45">{lane.label}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </SectionPanel>
        </div>

        <div className="relative z-10 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="space-y-6">
            <ScrollReveal>
              <SectionPanel
                icon={Calendar}
                eyebrow="Calendar"
                title="Upcoming events"
                action={<Link to="/events" className="btn btn-ghost btn-sm">View all <ArrowRight className="h-4 w-4" /></Link>}
              >
                {loading ? (
                  <ListSkeleton rows={3} withMedia />
                ) : events.length === 0 ? (
                  <EmptyPanel icon={Calendar} title="No upcoming events" description="New association gatherings will appear here when they are published." />
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <Link
                        key={event.id}
                        to={`/events/${event.slug}`}
                        className="group grid gap-4 border border-primary/10 bg-base-100/70 p-3 transition-colors hover:border-primary/20 hover:bg-base-200/55 sm:grid-cols-[74px_minmax(0,1fr)_auto] sm:items-center"
                      >
                        <span className="grid min-h-16 place-items-center bg-primary text-center text-primary-content">
                          <span>
                            <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-primary-content/55">{formatDate(event.date, 'MMM')}</span>
                            <span className="block text-2xl font-bold leading-none text-secondary">{formatDate(event.date, 'd')}</span>
                          </span>
                        </span>
                        <span className="min-w-0">
                          <span className="block font-bold leading-tight">{event.title}</span>
                          <span className="mt-2 flex items-center gap-1.5 text-sm text-base-content/52">
                            <MapPin className="h-4 w-4" />
                            {event.location || 'Location to be announced'}
                          </span>
                          {event.isFeatured && <span className="mt-2 inline-flex bg-secondary px-2 py-1 text-xs font-bold text-primary">Featured</span>}
                        </span>
                        <ArrowRight className="hidden h-5 w-5 text-base-content/28 transition-transform group-hover:translate-x-1 group-hover:text-primary sm:block" />
                      </Link>
                    ))}
                  </div>
                )}
              </SectionPanel>
            </ScrollReveal>

            <ScrollReveal delay={0.08}>
              <SectionPanel
                icon={Newspaper}
                eyebrow="Dispatches"
                title="Latest news"
                action={<Link to="/news" className="btn btn-ghost btn-sm">View all <ArrowRight className="h-4 w-4" /></Link>}
              >
                {loading ? (
                  <ListSkeleton rows={3} withMedia />
                ) : news.length === 0 ? (
                  <EmptyPanel icon={Newspaper} title="No news yet" description="Announcements, reports, and stories will show up here." />
                ) : (
                  <div className="grid gap-3">
                    {news.slice(0, 3).map((item) => (
                      <Link
                        key={item.id}
                        to={`/news/${item.slug}`}
                        className="group grid gap-4 border border-primary/10 bg-base-100/70 p-3 transition-colors hover:border-primary/20 hover:bg-base-200/55 sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:items-center"
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="h-20 w-full object-cover sm:w-[92px]" />
                        ) : (
                          <span className="grid h-20 place-items-center bg-secondary/15 text-secondary sm:w-[92px]">
                            <Newspaper className="h-6 w-6" />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="line-clamp-2 font-bold leading-tight">{item.title}</span>
                          <span className="mt-2 flex items-center gap-1.5 text-sm text-base-content/52">
                            <Clock className="h-4 w-4" />
                            {timeAgo(item.publishedAt || item.createdAt)}
                          </span>
                        </span>
                        <ArrowRight className="hidden h-5 w-5 text-base-content/28 transition-transform group-hover:translate-x-1 group-hover:text-primary sm:block" />
                      </Link>
                    ))}
                  </div>
                )}
              </SectionPanel>
            </ScrollReveal>
          </div>

          <div className="space-y-6">
            <ScrollReveal delay={0.12}>
              <SectionPanel icon={FileText} eyebrow="Recent movement" title="Activity stream">
                {recentActivity.length === 0 ? (
                  <EmptyPanel icon={FileText} title="No recent activity" description="News, events, gifts, and conversations will populate this stream." />
                ) : (
                  <div className="-mx-5 -my-5 sm:-mx-6">
                    {recentActivity.map((item) => (
                      <ActivityRow key={item.key} item={item} />
                    ))}
                  </div>
                )}
              </SectionPanel>
            </ScrollReveal>

            <ScrollReveal delay={0.16}>
              <SectionPanel
                icon={BarChart3}
                eyebrow="Decisions"
                title="Active polls"
                action={<Link to="/polls" className="btn btn-ghost btn-sm">Polls <ArrowRight className="h-4 w-4" /></Link>}
              >
                {loading ? (
                  <ListSkeleton rows={3} />
                ) : activePolls.length === 0 ? (
                  <EmptyPanel icon={BarChart3} title="No active polls" description="When a vote or survey is live, it will appear here." />
                ) : (
                  <div className="space-y-3">
                    {activePolls.slice(0, 3).map((poll) => {
                      const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0)
                      const leadingOption = [...poll.options].sort((a, b) => b.votes - a.votes)[0]
                      const leadingPercent = totalVotes > 0 && leadingOption ? (leadingOption.votes / totalVotes) * 100 : 0

                      return (
                        <Link key={poll.id} to="/polls" className="block border border-primary/10 bg-base-100/70 p-4 transition-colors hover:border-primary/20 hover:bg-base-200/55">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-bold leading-tight">{poll.question}</p>
                            {!poll.hasVoted && <span className="bg-secondary px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Vote</span>}
                          </div>
                          <div className="mt-3 h-2 overflow-hidden bg-base-300/65">
                            <div className="h-full bg-secondary" style={{ width: `${leadingPercent}%` }} />
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-base-content/50">
                            <span>{totalVotes} votes</span>
                            <span className="truncate">Leading: {leadingOption?.text || 'No votes yet'}</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </SectionPanel>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <SectionPanel
                icon={MessageSquare}
                eyebrow="Forum"
                title="Hot discussions"
                action={<Link to="/forum" className="btn btn-ghost btn-sm">Forum <ArrowRight className="h-4 w-4" /></Link>}
              >
                {loading ? (
                  <ListSkeleton rows={4} />
                ) : forumPosts.length === 0 ? (
                  <EmptyPanel icon={MessageSquare} title="No discussions yet" description="Start a topic and bring the year groups into the conversation." />
                ) : (
                  <div className="space-y-2">
                    {forumPosts.slice(0, 4).map((post) => (
                      <Link key={post.id} to={`/forum/${post.slug}`} className="group flex items-center gap-3 border border-transparent p-3 transition-colors hover:border-primary/10 hover:bg-base-200/55">
                        <Avatar src={post.author?.photoUrl} name={post.author?.fullName || 'User'} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold">{post.title}</span>
                          <span className="mt-0.5 block truncate text-xs text-base-content/50">
                            {post.author?.fullName || 'Member'} · {timeAgo(post.createdAt)}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-base-content/38">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {post._count?.comments || 0}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </SectionPanel>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
