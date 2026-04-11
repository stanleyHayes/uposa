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
import { Card, CardBody, CardHeader, StatCard } from '../../components/ui/Card'
import { useAuthStore } from '../../stores/auth.store'
import { eventsApi, newsApi, pollsApi, duesApi, forumApi } from '../../api/services'
import { formatDate, formatCurrency, timeAgo } from '../../utils/formatters'
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
        setEvents(eventsRes.status === 'fulfilled' ? eventsRes.value.data.data?.slice(0, 3) || [] : [])
        setNews(newsRes.status === 'fulfilled' ? newsRes.value.data.data || [] : [])
        setPolls(pollsRes.status === 'fulfilled' ? pollsRes.value.data.data || [] : [])
        setDues(duesRes.status === 'fulfilled' ? duesRes.value.data.data || [] : [])
        setForumPosts(forumRes.status === 'fulfilled' ? forumRes.value.data.data || [] : [])
      } catch {
        setEvents([])
        setNews([])
        setPolls([])
        setDues([])
        setForumPosts([])
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
    { to: '/events', label: 'Events', icon: Calendar, gradient: 'from-primary to-primary/80' },
    { to: '/news', label: 'News', icon: Newspaper, gradient: 'from-secondary to-secondary/80' },
    { to: '/jobs', label: 'Jobs', icon: Briefcase, gradient: 'from-accent to-accent/80' },
    { to: '/donations', label: 'Donate', icon: Heart, gradient: 'from-error to-error/80' },
    { to: '/dues', label: 'Dues', icon: CreditCard, gradient: 'from-secondary to-secondary/80' },
    { to: '/forum', label: 'Forum', icon: MessageSquare, gradient: 'from-info to-info/80' },
    { to: '/mentorship', label: 'Mentors', icon: Handshake, gradient: 'from-accent to-accent/80' },
    { to: '/members', label: 'Directory', icon: Users, gradient: 'from-primary to-primary/80' },
  ]

  const stats = [
    { label: 'Total Donated', value: formatCurrency(totalDonated), icon: TrendingUp, color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Active Polls', value: activePolls.length.toString(), icon: BarChart3, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Pending Dues', value: pendingDues.length.toString(), icon: CreditCard, color: pendingDues.length > 0 ? 'text-warning' : 'text-success', bg: pendingDues.length > 0 ? 'bg-warning/10' : 'bg-success/10' },
    { label: 'Forum Posts', value: forumPosts.length.toString(), icon: Flame, color: 'text-error', bg: 'bg-error/10' },
  ]

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Welcome banner */}
        <ScrollReveal>
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-content rounded-2xl p-6 md:p-8">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-content/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-secondary/10 rounded-full translate-y-1/2" />
            <div className="absolute top-4 right-12 w-3 h-3 bg-secondary/40 rounded-full" />
            <div className="absolute bottom-6 right-1/3 w-2 h-2 bg-primary-content/20 rounded-full" />

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
              <StatCard
                icon={<stat.icon className={`w-5 h-5 ${stat.color}`} />}
                value={stat.value}
                label={stat.label}
                iconBg={stat.bg}
              />
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* Quick links */}
        <StaggerChildren className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {quickLinks.map((link) => (
            <StaggerItem key={link.to}>
              <Link to={link.to} className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-base-200 transition-colors group">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                  <link.icon className="w-5 h-5 text-primary-content" />
                </div>
                <span className="text-xs font-medium text-base-content/70">{link.label}</span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* Outstanding dues alert */}
        {pendingDues.length > 0 && (
          <ScrollReveal>
            <Link to="/dues" className="alert bg-gradient-to-r from-warning/10 to-warning/5 border-warning/30 hover:shadow-md transition-shadow">
              <AlertCircle className="w-5 h-5 text-warning" />
              <div>
                <p className="font-medium text-sm">Outstanding Dues</p>
                <p className="text-xs text-base-content/60">You have {pendingDues.length} pending dues totaling {formatCurrency(pendingDues.reduce((s, d) => s + d.amount, 0))}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-warning" />
            </Link>
          </ScrollReveal>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming events */}
          <ScrollReveal>
            <Card hover={false} className="h-full">
              <CardHeader
                icon={<Calendar className="w-4 h-4 text-primary" />}
                iconBg="bg-primary/10"
                title="Upcoming Events"
                action={<Link to="/events" className="btn btn-ghost btn-xs gap-1">View all <ArrowRight className="w-3 h-3" /></Link>}
              />
              <CardBody>
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
              </CardBody>
            </Card>
          </ScrollReveal>

          {/* Latest news */}
          <ScrollReveal delay={0.1}>
            <Card hover={false} className="h-full">
              <CardHeader
                icon={<Newspaper className="w-4 h-4 text-secondary" />}
                iconBg="bg-secondary/10"
                title="Latest News"
                action={<Link to="/news" className="btn btn-ghost btn-xs gap-1">View all <ArrowRight className="w-3 h-3" /></Link>}
              />
              <CardBody>
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
              </CardBody>
            </Card>
          </ScrollReveal>

          {/* Active polls */}
          <ScrollReveal>
            <Card hover={false} className="h-full">
              <CardHeader
                icon={<BarChart3 className="w-4 h-4 text-accent" />}
                iconBg="bg-accent/10"
                title="Active Polls"
                action={<Link to="/polls" className="btn btn-ghost btn-xs gap-1">View all <ArrowRight className="w-3 h-3" /></Link>}
              />
              <CardBody>
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
                              <div className="h-full bg-gradient-to-r from-accent to-primary rounded-full" style={{ width: `${totalVotes > 0 ? (leadingOption.votes / totalVotes) * 100 : 0}%` }} />
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
              </CardBody>
            </Card>
          </ScrollReveal>

          {/* Recent discussions */}
          <ScrollReveal delay={0.1}>
            <Card hover={false} className="h-full">
              <CardHeader
                icon={<MessageSquare className="w-4 h-4 text-primary" />}
                iconBg="bg-[#FFF8DC]"
                title="Hot Discussions"
                action={<Link to="/forum" className="btn btn-ghost btn-xs gap-1">View all <ArrowRight className="w-3 h-3" /></Link>}
              />
              <CardBody>
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
              </CardBody>
            </Card>
          </ScrollReveal>
        </div>

        {/* Elections banner */}
        <ScrollReveal>
          <Link to="/elections" className="block">
            <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 !border-primary/20">
              <div className="px-5 py-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
                  <Vote className="w-6 h-6 text-primary-content" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">UPOSA Elections 2026</h3>
                  <p className="text-sm text-base-content/60">Presidential election is active. Cast your vote now!</p>
                </div>
                <ArrowRight className="w-5 h-5 text-primary" />
              </div>
            </Card>
          </Link>
        </ScrollReveal>
      </div>
    </PageTransition>
  )
}
