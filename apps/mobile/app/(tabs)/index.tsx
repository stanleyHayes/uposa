import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { Brand, Colors, Fonts, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
} from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useDrawerStore } from '@/lib/drawer-store';
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
} from '@/lib/types';
import {
  ActionRow,
  ActionText,
  EmptyState,
  HeroPanel,
  LoadingState,
  ProgressBar,
  ScreenHeader,
  ScreenScroll,
  SectionTitle,
  StatTile,
  Surface,
  formatDateTime,
  formatMoney,
  uiStyles,
} from '@/components/mobile-ui';

interface DuesSummary {
  totalDues: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

interface TrendPoint {
  key: string;
  label: string;
  giving: number;
  dues: number;
  engagement: number;
  events: number;
}

type IconName = ComponentProps<typeof Ionicons>['name'];

function compact(value: number) {
  return new Intl.NumberFormat('en', {
    notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function safeDate(value?: string | Date) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function emptyTrend(): TrendPoint[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      key: monthKey(date),
      label: date.toLocaleDateString('en', { month: 'short' }),
      giving: 0,
      dues: 0,
      engagement: 0,
      events: 0,
    };
  });
}

function buildTrend({
  donations,
  dues,
  forumPosts,
  events,
  news,
}: {
  donations: Donation[];
  dues: Due[];
  forumPosts: ForumPost[];
  events: Event[];
  news: News[];
}) {
  const points = emptyTrend();
  const index = new Map(points.map((point) => [point.key, point]));

  donations.forEach((donation) => {
    const date = safeDate(donation.createdAt);
    const point = date ? index.get(monthKey(date)) : null;
    if (point && donation.status !== 'FAILED') point.giving += donation.amount;
  });

  dues.forEach((due) => {
    const date = safeDate(due.paidAt);
    const point = date ? index.get(monthKey(date)) : null;
    if (point && due.status === 'PAID') point.dues += due.amount;
  });

  forumPosts.forEach((post) => {
    const date = safeDate(post.createdAt);
    const point = date ? index.get(monthKey(date)) : null;
    if (point) point.engagement += 1 + (post._count?.comments ?? 0);
  });

  news.forEach((item) => {
    const date = safeDate(item.publishedAt ?? item.createdAt);
    const point = date ? index.get(monthKey(date)) : null;
    if (point) point.engagement += 1;
  });

  events.forEach((event) => {
    const date = safeDate(event.date);
    const point = date ? index.get(monthKey(date)) : null;
    if (point) point.events += 1;
  });

  return points;
}

function ActionTile({
  palette,
  icon,
  label,
  detail,
  tone = 'default',
  onPress,
}: {
  palette: Palette;
  icon: IconName;
  label: string;
  detail: string;
  tone?: 'default' | 'gold' | 'navy';
  onPress: () => void;
}) {
  const active = tone === 'gold';
  const navy = tone === 'navy';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.78 : 1 }]}>
      <Surface palette={palette} tone={active ? 'gold' : navy ? 'navy' : 'default'} style={{ minHeight: 118, padding: 12, justifyContent: 'space-between' }}>
        <Ionicons name={icon} size={22} color={active ? Brand.navy : navy ? Brand.gold : palette.text} />
        <View>
          <Text style={{ color: active ? Brand.navy : navy ? Brand.cream : palette.text, fontSize: 13, fontFamily: Fonts.bodyBold }} numberOfLines={1}>
            {label}
          </Text>
          <Text style={{ color: active ? Brand.navy : navy ? 'rgba(255,248,220,0.68)' : palette.textMuted, fontSize: 11, fontFamily: Fonts.body, lineHeight: 15, marginTop: 3 }} numberOfLines={2}>
            {detail}
          </Text>
        </View>
      </Surface>
    </Pressable>
  );
}

function TrendPanel({ palette, trend }: { palette: Palette; trend: TrendPoint[] }) {
  const maxValue = Math.max(1, ...trend.flatMap((point) => [point.giving, point.dues, point.engagement, point.events]));
  const bars: { key: keyof Omit<TrendPoint, 'key' | 'label'>; color: string }[] = [
    { key: 'giving', color: Brand.gold },
    { key: 'dues', color: palette.tint },
    { key: 'engagement', color: palette.success },
    { key: 'events', color: Brand.navyLight },
  ];

  return (
    <Surface palette={palette} style={{ padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, minHeight: 154 }}>
        {trend.map((point) => (
          <View key={point.key} style={{ flex: 1, gap: 8, alignItems: 'center' }}>
            <View style={{ height: 116, width: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2, borderBottomWidth: 1, borderBottomColor: palette.border }}>
              {bars.map((bar) => (
                <View
                  key={bar.key}
                  style={{
                    width: 5,
                    minHeight: 5,
                    height: Math.max(5, (point[bar.key] / maxValue) * 104),
                    backgroundColor: bar.color,
                  }}
                />
              ))}
            </View>
            <Text style={{ color: palette.textMuted, fontSize: 10, fontFamily: Fonts.statusBold }}>{point.label}</Text>
          </View>
        ))}
      </View>
      <View style={[uiStyles.wrap, { marginTop: 12 }]}>
        <Legend palette={palette} color={Brand.gold} label="Giving" />
        <Legend palette={palette} color={palette.tint} label="Dues" />
        <Legend palette={palette} color={palette.success} label="Engagement" />
        <Legend palette={palette} color={Brand.navyLight} label="Events" />
      </View>
    </Surface>
  );
}

function Legend({ palette, color, label }: { palette: Palette; color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 14, height: 6, backgroundColor: color }} />
      <Text style={{ color: palette.textMuted, fontSize: 10, fontFamily: Fonts.status }}>{label}</Text>
    </View>
  );
}

function QueueRow({
  palette,
  icon,
  title,
  value,
  description,
  onPress,
}: {
  palette: Palette;
  icon: IconName;
  title: string;
  value: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <ActionRow
      palette={palette}
      icon={icon}
      title={title}
      description={description}
      onPress={onPress}
      trailing={<Text style={{ color: Brand.gold, fontSize: 14, fontFamily: Fonts.bodyBold }}>{value}</Text>}
    />
  );
}

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [events, setEvents] = useState<Event[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [duesSummary, setDuesSummary] = useState<DuesSummary | null>(null);
  const [dues, setDues] = useState<Due[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [elections, setElections] = useState<Election[]>([]);
  const [mentorshipRequests, setMentorshipRequests] = useState<MentorshipRequest[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [
        eventsRes,
        newsRes,
        duesSummaryRes,
        duesRes,
        donationsRes,
        pollsRes,
        projectsRes,
        forumRes,
        jobsRes,
        electionsRes,
        mentorshipRes,
        paymentMethodsRes,
      ] = await Promise.allSettled([
        eventsApi.upcoming(),
        newsApi.list({ limit: 5 }),
        duesApi.summary(),
        duesApi.my(),
        donationsApi.my(),
        pollsApi.list({ limit: 5 }),
        projectsApi.ongoing(),
        forumApi.posts({ limit: 5 }),
        jobsApi.list({ limit: 5 }),
        electionsApi.list({ limit: 4 }),
        mentorshipApi.myRequests(),
        paymentMethodsApi.list(),
      ]);

      setEvents(eventsRes.status === 'fulfilled' ? eventsRes.value.data.data?.slice(0, 4) ?? [] : []);
      setNews(newsRes.status === 'fulfilled' ? newsRes.value.data.data ?? [] : []);
      setDuesSummary(duesSummaryRes.status === 'fulfilled' ? duesSummaryRes.value.data.data ?? null : null);
      setDues(duesRes.status === 'fulfilled' ? duesRes.value.data.data ?? [] : []);
      setDonations(donationsRes.status === 'fulfilled' ? donationsRes.value.data.data ?? [] : []);
      setPolls(pollsRes.status === 'fulfilled' ? pollsRes.value.data.data ?? [] : []);
      setProjects(projectsRes.status === 'fulfilled' ? projectsRes.value.data.data?.slice(0, 3) ?? [] : []);
      setForumPosts(forumRes.status === 'fulfilled' ? forumRes.value.data.data ?? [] : []);
      setJobs(jobsRes.status === 'fulfilled' ? jobsRes.value.data.data ?? [] : []);
      setElections(electionsRes.status === 'fulfilled' ? electionsRes.value.data.data ?? [] : []);
      setMentorshipRequests(mentorshipRes.status === 'fulfilled' ? mentorshipRes.value.data.data ?? [] : []);
      setPaymentMethods(paymentMethodsRes.status === 'fulfilled' ? paymentMethodsRes.value.data.data ?? [] : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const trend = useMemo(
    () => buildTrend({ donations, dues, forumPosts, events, news }),
    [donations, dues, forumPosts, events, news],
  );

  if (loading) {
    return <LoadingState palette={palette} title="Alumni dashboard" rows={6} />;
  }

  const firstName = user?.fullName?.split(' ')[0] ?? 'Member';
  const pendingAmount = duesSummary?.totalPending ?? dues.filter((due) => due.status === 'PENDING').reduce((sum, due) => sum + due.amount, 0);
  const paid = duesSummary?.totalPaid ?? dues.filter((due) => due.status === 'PAID').reduce((sum, due) => sum + due.amount, 0);
  const overdue = duesSummary?.totalOverdue ?? dues.filter((due) => due.status === 'OVERDUE').reduce((sum, due) => sum + due.amount, 0);
  const openBalance = pendingAmount + overdue;
  const activePolls = polls.filter((poll) => poll.status === 'ACTIVE');
  const pollsAwaitingVote = activePolls.filter((poll) => !poll.hasVoted);
  const activeElections = elections.filter((election) => election.status === 'ACTIVE');
  const electionsAwaitingVote = activeElections.filter((election) => !election.hasVoted);
  const pendingMentorship = mentorshipRequests.filter((request) => request.status === 'PENDING');
  const totalDonated = donations.reduce((sum, donation) => donation.status === 'FAILED' ? sum : sum + donation.amount, 0);
  const forumCount = forumPosts.reduce((sum, post) => sum + 1 + (post._count?.comments ?? 0), 0);
  const primaryProject = projects[0];
  const projectPct = primaryProject && primaryProject.goalAmount > 0
    ? Math.min(100, Math.round((primaryProject.raisedAmount / primaryProject.goalAmount) * 100))
    : 0;
  const decisionCount = pollsAwaitingVote.length + electionsAwaitingVote.length;
  const paymentAvailable = paymentMethods.length > 0;

  return (
    <ScreenScroll
      palette={palette}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.tint} />}
    >
      <ScreenHeader
        palette={palette}
        eyebrow="Member dashboard"
        title={`Welcome back, ${firstName}.`}
        description="Your alumni snapshot across dues, giving, decisions, events, projects, jobs, mentorship, and conversations."
        icon="grid-outline"
      />

      <HeroPanel
        palette={palette}
        eyebrow={openBalance > 0 ? 'Priority command' : 'Member access active'}
        title={openBalance > 0 ? `${formatMoney(openBalance)} due` : 'Your member desk is clear'}
        body={openBalance > 0 ? 'Settle outstanding dues first, then keep moving through the network.' : 'Keep giving, voting, attending, and staying visible in the alumni network.'}
        icon={openBalance > 0 ? 'card-outline' : 'checkmark-done-outline'}
      >
        <View style={uiStyles.row}>
          <Pressable onPress={() => router.push(openBalance > 0 ? '/dues' : '/donations')} style={{ flex: 1 }}>
            <Surface palette={palette} tone="gold" style={{ padding: 12 }}>
              <Text style={{ color: Brand.navy, fontSize: 12, fontFamily: Fonts.statusBold }}>{openBalance > 0 ? 'Settle dues' : 'Give now'}</Text>
            </Surface>
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/profile')} style={{ flex: 1, marginLeft: 10 }}>
            <Surface palette={palette} style={{ padding: 12, backgroundColor: 'rgba(255,248,220,0.08)' }}>
              <Text style={{ color: Brand.cream, fontSize: 12, fontFamily: Fonts.statusBold }}>Review profile</Text>
            </Surface>
          </Pressable>
        </View>
      </HeroPanel>

      <View style={[uiStyles.row, { gap: 10, marginBottom: 10 }]}>
        <StatTile palette={palette} icon="card-outline" label="Open dues" value={openBalance > 0 ? formatMoney(openBalance) : 'Clear'} tone={openBalance > 0 ? 'muted' : 'gold'} />
        <StatTile palette={palette} icon="heart-outline" label="Giving" value={formatMoney(totalDonated)} tone="gold" />
      </View>
      <View style={[uiStyles.row, { gap: 10 }]}>
        <StatTile palette={palette} icon="bar-chart-outline" label="Decisions" value={String(decisionCount)} tone="muted" />
        <StatTile palette={palette} icon="chatbubbles-outline" label="Community pulse" value={compact(forumCount)} tone="navy" />
      </View>

      <SectionTitle palette={palette} title="Platform rhythm" />
      <TrendPanel palette={palette} trend={trend} />

      <SectionTitle
        palette={palette}
        title="Action board"
        action={<ActionText label="More" palette={palette} onPress={() => useDrawerStore.getState().open()} />}
      />
      <View style={{ gap: 10 }}>
        <View style={[uiStyles.row, { gap: 10 }]}>
          <ActionTile palette={palette} icon="card-outline" label="Pay dues" detail={paymentAvailable ? 'Online rails ready' : 'Provider pending'} tone="gold" onPress={() => router.push('/dues')} />
          <ActionTile palette={palette} icon="heart-outline" label="Donate" detail="Support projects" tone="navy" onPress={() => router.push('/donations')} />
        </View>
        <View style={[uiStyles.row, { gap: 10 }]}>
          <ActionTile palette={palette} icon="people-outline" label="Directory" detail="Find classmates" onPress={() => router.push('/(tabs)/members')} />
          <ActionTile palette={palette} icon="hand-left-outline" label="Mentors" detail={`${pendingMentorship.length} pending`} onPress={() => router.push('/mentorship')} />
        </View>
        <View style={[uiStyles.row, { gap: 10 }]}>
          <ActionTile palette={palette} icon="briefcase-outline" label="Jobs" detail={`${jobs.length} opportunities`} onPress={() => router.push('/jobs')} />
          <ActionTile palette={palette} icon="chatbubbles-outline" label="Forum" detail={`${forumPosts.length} threads`} onPress={() => router.push('/forum')} />
        </View>
      </View>

      <SectionTitle palette={palette} title="Priority queue" />
      <QueueRow
        palette={palette}
        icon="warning-outline"
        title="Dues requiring attention"
        description={overdue > 0 ? `${formatMoney(overdue)} overdue from your records.` : 'Open balances are ready for payment.'}
        value={openBalance > 0 ? formatMoney(openBalance) : 'Clear'}
        onPress={() => router.push('/dues')}
      />
      <QueueRow
        palette={palette}
        icon="checkbox-outline"
        title="Polls and elections"
        description="Decision points where your vote has not been recorded."
        value={String(decisionCount)}
        onPress={() => router.push(pollsAwaitingVote.length > 0 ? '/polls' : '/elections')}
      />
      <QueueRow
        palette={palette}
        icon="calendar-outline"
        title="Upcoming events"
        description="Plan for gatherings, reunions, and association programs."
        value={String(events.length)}
        onPress={() => router.push('/(tabs)/events')}
      />
      <QueueRow
        palette={palette}
        icon="briefcase-outline"
        title="Jobs board"
        description="Fresh roles and opportunities from the network."
        value={String(jobs.length)}
        onPress={() => router.push('/jobs')}
      />

      {primaryProject ? (
        <>
          <SectionTitle
            palette={palette}
            title="School support"
            action={<ActionText label="Projects" palette={palette} onPress={() => router.push('/projects')} />}
          />
          <Surface palette={palette} style={{ padding: 14, gap: 10 }}>
            <Text style={{ color: palette.text, fontSize: 16, fontFamily: Fonts.display }}>{primaryProject.title}</Text>
            <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19 }} numberOfLines={2}>
              {primaryProject.description}
            </Text>
            <ProgressBar palette={palette} percent={projectPct} />
            <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.bodyMedium }}>
              {formatMoney(primaryProject.raisedAmount)} of {formatMoney(primaryProject.goalAmount)} raised
            </Text>
          </Surface>
        </>
      ) : null}

      <SectionTitle
        palette={palette}
        title="Latest dispatches"
        action={<ActionText label="News" palette={palette} onPress={() => router.push('/(tabs)/news')} />}
      />
      {news.length === 0 ? (
        <EmptyState palette={palette} icon="newspaper-outline" title="No news yet" description="Announcements, reports, and meeting notes will appear here." />
      ) : (
        news.slice(0, 3).map((item) => (
          <ActionRow
            key={item.id}
            palette={palette}
            icon="newspaper-outline"
            title={item.title}
            description={item.excerpt || formatDateTime(item.publishedAt ?? item.createdAt)}
            onPress={() => router.push(`/news/${item.slug}`)}
          />
        ))
      )}

      <SectionTitle
        palette={palette}
        title="Upcoming events"
        action={<ActionText label="See all" palette={palette} onPress={() => router.push('/(tabs)/events')} />}
      />
      {events.length === 0 ? (
        <EmptyState palette={palette} icon="calendar-outline" title="No upcoming events" description="New gatherings will show here once executives publish them." />
      ) : (
        events.slice(0, 3).map((event) => (
          <ActionRow
            key={event.id}
            palette={palette}
            icon="calendar-outline"
            title={event.title}
            description={`${formatDateTime(event.date)}${event.location ? ` · ${event.location}` : ''}`}
            onPress={() => router.push(`/events/${event.slug}`)}
          />
        ))
      )}

      <SectionTitle palette={palette} title="Community pulse" />
      {forumPosts.length === 0 && activePolls.length === 0 ? (
        <EmptyState palette={palette} icon="chatbubbles-outline" title="No community movement yet" description="Forum threads and active polls will appear here." />
      ) : (
        <>
          {forumPosts.slice(0, 2).map((post) => (
            <ActionRow
              key={post.id}
              palette={palette}
              icon="chatbubbles-outline"
              title={post.title}
              description={`${post.author?.fullName ?? 'Member'} · ${post._count?.comments ?? 0} replies`}
              onPress={() => router.push(`/forum/${post.slug}`)}
            />
          ))}
          {activePolls.slice(0, 2).map((poll) => (
            <ActionRow
              key={poll.id}
              palette={palette}
              icon="bar-chart-outline"
              title={poll.question}
              description={poll.hasVoted ? 'Vote recorded' : 'Your vote is still pending'}
              onPress={() => router.push('/polls')}
            />
          ))}
        </>
      )}

      <SectionTitle palette={palette} title="Profile snapshot" />
      <Surface palette={palette} style={{ padding: 14, gap: 12, marginBottom: 4 }}>
        <View style={[uiStyles.between, { alignItems: 'flex-start' }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.text, fontSize: 16, fontFamily: Fonts.display }}>{user?.fullName ?? 'UPOSA member'}</Text>
            <Text style={{ color: palette.textMuted, fontSize: 12, fontFamily: Fonts.body, marginTop: 4 }}>
              {user?.yearGroup ? `Year group ${user.yearGroup}` : 'Year group pending'} · {user?.house ? `${user.house} House` : 'House pending'}
            </Text>
          </View>
          <Ionicons name={user?.membershipStatus === 'ACTIVE' ? 'shield-checkmark-outline' : 'time-outline'} size={24} color={Brand.gold} />
        </View>
        <View style={[uiStyles.row, { gap: 10 }]}>
          <Surface palette={palette} tone="muted" style={{ flex: 1, padding: 10 }}>
            <Text style={{ color: palette.textMuted, fontSize: 10, fontFamily: Fonts.statusBold }}>PAID DUES</Text>
            <Text style={{ color: palette.text, fontSize: 14, fontFamily: Fonts.bodyBold, marginTop: 5 }}>{formatMoney(paid)}</Text>
          </Surface>
          <Surface palette={palette} tone="muted" style={{ flex: 1, padding: 10 }}>
            <Text style={{ color: palette.textMuted, fontSize: 10, fontFamily: Fonts.statusBold }}>STATUS</Text>
            <Text style={{ color: palette.text, fontSize: 14, fontFamily: Fonts.bodyBold, marginTop: 5 }}>{user?.membershipStatus ?? 'PENDING'}</Text>
          </Surface>
        </View>
      </Surface>
    </ScreenScroll>
  );
}
