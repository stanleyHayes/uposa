import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  Calendar, Newspaper, Briefcase, Heart, CreditCard, MessageSquare,
  BarChart3, Vote, ArrowRight, Clock, AlertCircle, Users, Handshake,
  TrendingUp, Star, Flame,
} from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from '../../components/common/PageTransition'
import ScrollReveal from '../../components/common/ScrollReveal'
import StaggerChildren, { StaggerItem } from '../../components/common/StaggerChildren'
import Avatar from '../../components/ui/Avatar'
import { useAuthStore } from '../../stores/auth.store'
import { eventsApi, newsApi, pollsApi, duesApi, forumApi } from '../../api/services'
import { formatDate, formatCurrency, timeAgo } from '../../utils/formatters'
import { MOCK_EVENTS, MOCK_NEWS, MOCK_POLLS, MOCK_DUES, MOCK_FORUM_POSTS } from '../../data/mock'
import type { Event, News, Poll, Due, ForumPost } from '../../types'

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [events, setEvents] = useState<Event[]>([])
  const [news, setNews] = useState<News[]>([])
  const [polls, setPolls] = useState<Poll[]>([])
  const [dues, setDues] = useState<Due[]>([])
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [eventsRes, newsRes, pollsRes, duesRes, forumRes] = await Promise.allSettled([
          eventsApi.upcoming(),
          newsApi.list({ limit: 3 }),
          pollsApi.list({ limit: 3 }),
          duesApi.my(),
          forumApi.posts({ limit: 5 }),
        ])
        setEvents(eventsRes.status === 'fulfilled' ? eventsRes.value.data.data?.slice(0, 3) || [] : MOCK_EVENTS.filter(e => e.status === 'UPCOMING').slice(0, 3))
        setNews(newsRes.status === 'fulfilled' ? newsRes.value.data.data || [] : MOCK_NEWS.slice(0, 3))
        setPolls(pollsRes.status === 'fulfilled' ? pollsRes.value.data.data || [] : MOCK_POLLS)
        setDues(duesRes.status === 'fulfilled' ? duesRes.value.data.data || [] : MOCK_DUES)
        setForumPosts(forumRes.status === 'fulfilled' ? forumRes.value.data.data || [] : MOCK_FORUM_POSTS.slice(0, 5))
      } catch {
        // Fallback to mock data
        setEvents(MOCK_EVENTS.filter(e => e.status === 'UPCOMING').slice(0, 3))
        setNews(MOCK_NEWS.slice(0, 3))
        setPolls(MOCK_POLLS)
        setDues(MOCK_DUES)
        setForumPosts(MOCK_FORUM_POSTS.slice(0, 5))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const pendingDues = dues.filter((d) => d.status !== 'PAID')
  const activePolls = polls.filter((p) => p.status === 'ACTIVE')
  const totalDonated = 1700

  const quickLinks = [
    { to: '/events', label: 'Events', icon: Calendar, gradient: 'from-blue-500 to-blue-600' },
    { to: '/news', label: 'News', icon: Newspaper, gradient: 'from-emerald-500 to-emerald-600' },
    { to: '/jobs', label: 'Jobs', icon: Briefcase, gradient: 'from-violet-500 to-violet-600' },
    { to: '/donations', label: 'Donate', icon: Heart, gradient: 'from-rose-500 to-rose-600' },
    { to: '/dues', label: 'Dues', icon: CreditCard, gradient: 'from-amber-500 to-amber-600' },
    { to: '/forum', label: 'Forum', icon: MessageSquare, gradient: 'from-cyan-500 to-cyan-600' },
    { to: '/mentorship', label: 'Mentors', icon: Handshake, gradient: 'from-teal-500 to-teal-600' },
    { to: '/members', label: 'Directory', icon: Users, gradient: 'from-indigo-500 to-indigo-600' },
  ]

  const stats = [
    { label: 'Total Donated', value: formatCurrency(totalDonated), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Active Polls', value: activePolls.length.toString(), icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Pending Dues', value: pendingDues.length.toString(), icon: CreditCard, color: pendingDues.length > 0 ? 'text-amber-500' : 'text-emerald-500', bg: pendingDues.length > 0 ? 'bg-amber-500/10' : 'bg-emerald-500/10' },
    { label: 'Forum Posts', value: forumPosts.length.toString(), icon: Flame, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ]

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Welcome banner */}
        <ScrollReveal>
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-content rounded-2xl p-6 md:p-8">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-secondary/10 rounded-full translate-y-1/2" />
            <div className="absolute top-4 right-12 w-3 h-3 bg-secondary/40 rounded-full" />
            <div className="absolute bottom-6 right-1/3 w-2 h-2 bg-white/20 rounded-full" />

            <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <Avatar src={user?.photoUrl} name={user?.fullName || 'User'} size="xl" />
              </motion.div>
              <div className="flex-1">
                <motion.h1
                  className="text-2xl md:text-3xl font-bold"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Welcome back, {user?.fullName?.split(' ')[0]}!
                </motion.h1>
                <motion.p
                  className="text-primary-content/70 mt-1"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {user?.yearGroup ? `Class of ${user.yearGroup}` : 'Alumni Member'} {user?.house ? `· ${user.house} House` : ''}
                </motion.p>
                {user?.membershipStatus === 'PENDING' && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-3 inline-flex items-center gap-2 bg-warning/20 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Registration pending approval
                  </motion.div>
                )}
              </div>
              <motion.div
                className="hidden md:block text-right"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              >
                <p className="text-sm text-primary-content/60">Member since</p>
                <p className="font-semibold">{user?.createdAt ? formatDate(user.createdAt, 'MMM yyyy') : 'N/A'}</p>
              </motion.div>
            </div>
          </div>
        </ScrollReveal>

        {/* Stats row */}
        <StaggerChildren className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="card bg-base-100 border border-base-300">
                <div className="card-body p-4 flex-row items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-base-content/50">{stat.label}</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* Quick links */}
        <StaggerChildren className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {quickLinks.map((link) => (
            <StaggerItem key={link.to}>
              <Link to={link.to} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-base-200 transition-colors group">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                  <link.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-base-content/70">{link.label}</span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* Outstanding dues alert */}
        {pendingDues.length > 0 && (
          <ScrollReveal>
            <Link to="/dues" className="alert bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:shadow-md transition-shadow">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <div>
                <p className="font-medium text-sm">Outstanding Dues</p>
                <p className="text-xs text-base-content/60">You have {pendingDues.length} pending dues totaling {formatCurrency(pendingDues.reduce((s, d) => s + d.amount, 0))}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-500" />
            </Link>
          </ScrollReveal>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming events */}
          <ScrollReveal>
            <div className="card bg-base-100 border border-base-300 h-full">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <h2 className="font-bold">Upcoming Events</h2>
                  </div>
                  <Link to="/events" className="btn btn-ghost btn-xs gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
                </div>
                {loading ? (
                  <div className="flex justify-center py-8"><span className="loading loading-spinner text-primary" /></div>
                ) : events.length === 0 ? (
                  <p className="text-base-content/60 text-center py-4">No upcoming events</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <Link key={event.id} to={`/events/${event.slug}`} className="flex items-start gap-3 p-3 rounded-xl hover:bg-base-200/60 transition-colors">
                        <div className="bg-gradient-to-br from-primary/15 to-secondary/15 text-primary rounded-xl p-2 text-center min-w-[52px]">
                          <div className="text-[10px] font-bold uppercase tracking-wide">{formatDate(event.date, 'MMM')}</div>
                          <div className="text-xl font-black leading-tight">{formatDate(event.date, 'd')}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{event.title}</p>
                          <p className="text-xs text-base-content/50 mt-0.5">{event.location || 'TBA'}</p>
                          {event.isFeatured && <span className="badge badge-secondary badge-xs mt-1">Featured</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Latest news */}
          <ScrollReveal delay={0.1}>
            <div className="card bg-base-100 border border-base-300 h-full">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Newspaper className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h2 className="font-bold">Latest News</h2>
                  </div>
                  <Link to="/news" className="btn btn-ghost btn-xs gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
                </div>
                {loading ? (
                  <div className="flex justify-center py-8"><span className="loading loading-spinner text-primary" /></div>
                ) : news.length === 0 ? (
                  <p className="text-base-content/60 text-center py-4">No news yet</p>
                ) : (
                  <div className="space-y-3">
                    {news.map((item) => (
                      <Link key={item.id} to={`/news/${item.slug}`} className="flex gap-3 p-3 rounded-xl hover:bg-base-200/60 transition-colors">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm line-clamp-2">{item.title}</p>
                          <p className="text-xs text-base-content/50 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{timeAgo(item.publishedAt || item.createdAt)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Active polls */}
          <ScrollReveal>
            <div className="card bg-base-100 border border-base-300 h-full">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-violet-500" />
                    </div>
                    <h2 className="font-bold">Active Polls</h2>
                  </div>
                  <Link to="/polls" className="btn btn-ghost btn-xs gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
                </div>
                {activePolls.length === 0 ? (
                  <p className="text-base-content/60 text-center py-4">No active polls</p>
                ) : (
                  <div className="space-y-3">
                    {activePolls.map((poll) => {
                      const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0)
                      const leadingOption = [...poll.options].sort((a, b) => b.votes - a.votes)[0]
                      return (
                        <Link key={poll.id} to="/polls" className="block p-3 rounded-xl hover:bg-base-200/60 transition-colors">
                          <p className="font-semibold text-sm">{poll.question}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 bg-base-200 rounded-full h-2 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" style={{ width: `${totalVotes > 0 ? (leadingOption.votes / totalVotes) * 100 : 0}%` }} />
                            </div>
                            <span className="text-xs text-base-content/50">{totalVotes} votes</span>
                          </div>
                          <p className="text-xs text-base-content/50 mt-1 flex items-center gap-1">
                            <Star className="w-3 h-3" /> Leading: {leadingOption.text}
                          </p>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>

          {/* Recent discussions */}
          <ScrollReveal delay={0.1}>
            <div className="card bg-base-100 border border-base-300 h-full">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-cyan-500" />
                    </div>
                    <h2 className="font-bold">Hot Discussions</h2>
                  </div>
                  <Link to="/forum" className="btn btn-ghost btn-xs gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
                </div>
                {forumPosts.length === 0 ? (
                  <p className="text-base-content/60 text-center py-4">No discussions yet</p>
                ) : (
                  <div className="space-y-2">
                    {forumPosts.map((post) => (
                      <Link key={post.id} to={`/forum/${post.slug}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200/60 transition-colors">
                        <Avatar src={post.author?.photoUrl} name={post.author?.fullName || 'User'} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{post.title}</p>
                          <p className="text-xs text-base-content/50">{post.author?.fullName} · {timeAgo(post.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-base-content/40">
                          <MessageSquare className="w-3 h-3" />
                          {post._count?.comments || 0}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Elections banner */}
        <ScrollReveal>
          <Link to="/elections" className="card bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 hover:shadow-md transition-shadow">
            <div className="card-body p-5 flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">UPOSA Elections 2026</h3>
                <p className="text-sm text-base-content/60">Presidential election is active. Cast your vote now!</p>
              </div>
              <ArrowRight className="w-5 h-5 text-indigo-500" />
            </div>
          </Link>
        </ScrollReveal>
      </div>
    </PageTransition>
  )
}
