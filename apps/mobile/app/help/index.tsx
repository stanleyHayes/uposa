import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Fonts } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Field, ScreenHeader, ScreenScroll, SectionTitle, Surface } from '@/components/mobile-ui';

interface HelpTopic {
  id: string;
  title: string;
  routeLabel: string;
  summary: string;
  sections: string[];
  actions: string[];
}

// Ported from apps/alumni/src/components/help/helpContent.ts (alumniHelpTopics).
const helpTopics: HelpTopic[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    routeLabel: 'Dashboard',
    summary: 'A member snapshot for dues, donations, community activity, updates, and quick portal actions.',
    sections: [
      'Use the overview to see what needs your attention first.',
      'Recent updates and community prompts help you stay connected without visiting every page.',
      'Quick cards point to common actions such as dues, donations, mentorship, and requests.',
    ],
    actions: ['Check dues and requests first.', 'Use quick links when you want to move fast.'],
  },
  {
    id: 'profile',
    title: 'My Profile',
    routeLabel: 'Profile',
    summary: 'Your member identity, contact details, class information, and public profile data.',
    sections: [
      'Keep your name, year group, occupation, and contact details accurate.',
      'Profile completeness helps classmates and the association reach you.',
    ],
    actions: ['Update incomplete details.', 'Refresh your photo when needed.'],
  },
  {
    id: 'news',
    title: 'News',
    routeLabel: 'News',
    summary: 'Association stories, official updates, dispatches, and articles for members.',
    sections: ['Use the list to browse recent posts.', 'Open a detail page for the full story and related context.'],
    actions: ['Read featured updates.', 'Share important dispatches with your year group.'],
  },
  {
    id: 'events',
    title: 'Events',
    routeLabel: 'Events',
    summary: 'Upcoming and past gatherings, homecomings, meetings, and school or alumni activities.',
    sections: ['Event cards show timing and location.', 'Detail pages provide RSVP or attendance context when available.'],
    actions: ['RSVP early when a response is needed.', 'Check event details before traveling.'],
  },
  {
    id: 'projects',
    title: 'Projects',
    routeLabel: 'Projects',
    summary: 'Association initiatives, fundraising goals, progress, and completed community work.',
    sections: [
      'Project pages show what the association is building or supporting.',
      'Progress details help members understand funding needs and milestones.',
    ],
    actions: ['Support active projects.', 'Review completed work for impact context.'],
  },
  {
    id: 'donations',
    title: 'Donations',
    routeLabel: 'Donations',
    summary: 'A place to give voluntary support through available donation rails.',
    sections: ['Choose a donation amount and payment route.', 'Donation history helps you track giving when records are available.'],
    actions: ['Use a verified payment method.', 'Check references before submitting manual payment records.'],
  },
  {
    id: 'dues',
    title: 'My Dues',
    routeLabel: 'Dues',
    summary: 'Your membership dues status, payment options, and related records.',
    sections: ['Use this page to confirm what is due.', 'Payment actions help keep your membership standing current.'],
    actions: ['Pay outstanding dues.', 'Review the period before submitting payment.'],
  },
  {
    id: 'jobs',
    title: 'Jobs Board',
    routeLabel: 'Jobs',
    summary: 'Career opportunities shared by alumni, partners, and the community.',
    sections: ['Browse openings and details.', 'Job detail pages show requirements, contacts, and application guidance.'],
    actions: ['Apply to relevant roles.', 'Share credible opportunities with the community.'],
  },
  {
    id: 'mentorship',
    title: 'Mentorship',
    routeLabel: 'Mentorship',
    summary: 'Connect with alumni who can guide students and younger members.',
    sections: ['Mentor profiles show expertise and availability.', 'Requests help start structured guidance conversations.'],
    actions: ['Request a fitting mentor.', 'Keep your own mentor availability updated if you volunteer.'],
  },
  {
    id: 'directory',
    title: 'Directory',
    routeLabel: 'Directory',
    summary: 'Find classmates, year groups, and alumni contacts inside the member community.',
    sections: ['Use filters and search to narrow the list.', 'Member profile pages show public professional and class information.'],
    actions: ['Search by name, class, or profession.', 'Respect member privacy when reaching out.'],
  },
  {
    id: 'forum',
    title: 'Forum',
    routeLabel: 'Forum',
    summary: 'Member discussions, replies, announcements, and community conversations.',
    sections: ['Browse topics from the list.', 'Detail pages hold the thread and replies.'],
    actions: ['Contribute respectfully.', 'Follow active discussions you care about.'],
  },
  {
    id: 'polls',
    title: 'Polls',
    routeLabel: 'Polls',
    summary: 'Quick member feedback and association pulse checks.',
    sections: ['Active polls are available for voting.', 'Results may show how members are responding.'],
    actions: ['Vote before polls close.', 'Use results as community feedback, not formal election outcomes.'],
  },
  {
    id: 'elections',
    title: 'Elections',
    routeLabel: 'Elections',
    summary: 'Formal association elections, candidates, voting windows, and results.',
    sections: ['Election cards show open or upcoming votes.', 'Candidate details help you decide before voting.'],
    actions: ['Review candidates carefully.', 'Vote only during active windows.'],
  },
  {
    id: 'requests',
    title: 'Requests',
    routeLabel: 'Requests',
    summary: 'Service forms for transcript support, recommendations, and related membership help.',
    sections: ['Choose the correct request type before filling the form.', 'Complete details help the team process requests faster.'],
    actions: ['Submit accurate information.', 'Use contact if you need clarification before requesting.'],
  },
  {
    id: 'contact',
    title: 'Contact',
    routeLabel: 'Contact',
    summary: 'Reach the association team for support, enquiries, and service follow-up.',
    sections: ['Use this page for questions that do not fit a structured request.', 'Include clear contact details and context.'],
    actions: ['Send concise messages.', 'Use request forms when the issue has a dedicated process.'],
  },
  {
    id: 'settings',
    title: 'Settings',
    routeLabel: 'Settings',
    summary: 'Account preferences, security, notifications, and portal settings.',
    sections: ['Settings affect your personal portal account.', 'Notification choices control how you receive updates.'],
    actions: ['Keep your account secure.', 'Review notification preferences after joining.'],
  },
  {
    id: 'gallery',
    title: 'Gallery',
    routeLabel: 'Gallery',
    summary: 'Photos and collections from school life, alumni gatherings, projects, and events.',
    sections: ['Browse categories for different moments.', 'Images help preserve association history.'],
    actions: ['Explore recent collections.', 'Share strong archive material with the association team.'],
  },
  {
    id: 'help',
    title: 'Help Library',
    routeLabel: 'Help',
    summary: 'A page-by-page guide to the alumni portal, with text-to-speech controls.',
    sections: ['Use page help from the profile menu for the current screen.', 'Use the library when you want a broader explanation.'],
    actions: ['Replay the dashboard tour anytime.', 'Use listen controls for spoken guidance.'],
  },
];

function topicToSpeech(topic: HelpTopic): string {
  return [topic.title, topic.summary, ...topic.sections, 'Recommended actions.', ...topic.actions].join('. ');
}

export default function HelpScreen() {
  const scheme = useColorScheme() ?? 'light';
  const palette = Colors[scheme];

  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  useEffect(() => () => {
    Speech.stop();
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return helpTopics;
    return helpTopics.filter((topic) =>
      [topic.title, topic.routeLabel, topic.summary, ...topic.sections, ...topic.actions].join(' ').toLowerCase().includes(term),
    );
  }, [query]);

  const toggleExpanded = (topicId: string) => {
    if (expandedId === topicId && speakingId === topicId) {
      Speech.stop();
      setSpeakingId(null);
    }
    setExpandedId((current) => (current === topicId ? null : topicId));
  };

  const toggleSpeech = (topic: HelpTopic) => {
    if (speakingId === topic.id) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }
    Speech.stop();
    Speech.speak(topicToSpeech(topic), {
      rate: 0.94,
      onDone: () => setSpeakingId(null),
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
    setSpeakingId(topic.id);
  };

  return (
    <ScreenScroll palette={palette} keyboardShouldPersistTaps="handled">
      <ScreenHeader
        palette={palette}
        eyebrow="Help library"
        title="Help"
        description="Know what every member page is for. Every topic can be read aloud."
        icon="help-buoy-outline"
      />

      <Field
        palette={palette}
        label="Search topics"
        value={query}
        onChangeText={setQuery}
        placeholder="e.g. dues, mentorship, elections..."
        icon="search-outline"
        autoCapitalize="none"
      />

      <SectionTitle palette={palette} title={query.trim() ? `${filtered.length} topic${filtered.length === 1 ? '' : 's'} found` : 'All topics'} />

      <View style={{ gap: 10 }}>
        {filtered.length === 0 ? (
          <Surface palette={palette} style={{ padding: 22, alignItems: 'center' }}>
            <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, textAlign: 'center' }}>
              No help topics match your search.
            </Text>
          </Surface>
        ) : (
          filtered.map((topic) => {
            const expanded = expandedId === topic.id;
            const speaking = speakingId === topic.id;
            return (
              <Surface key={topic.id} palette={palette} style={{ padding: 14 }}>
                <Pressable onPress={() => toggleExpanded(topic.id)} style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.accent, fontSize: 10, fontFamily: Fonts.statusBold, letterSpacing: 1.6, textTransform: 'uppercase' }}>
                        {topic.routeLabel}
                      </Text>
                      <Text style={{ color: palette.text, fontSize: 16, fontFamily: Fonts.bodyBold, marginTop: 4 }}>{topic.title}</Text>
                    </View>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={palette.textMuted} />
                  </View>
                </Pressable>

                {expanded ? (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    <Text style={{ color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19 }}>{topic.summary}</Text>
                    {topic.sections.map((section) => (
                      <View key={section} style={{ flexDirection: 'row', gap: 8 }}>
                        <Text style={{ color: palette.accent, fontSize: 13, fontFamily: Fonts.bodyBold }}>•</Text>
                        <Text style={{ flex: 1, color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19 }}>{section}</Text>
                      </View>
                    ))}
                    <Text style={{ color: palette.text, fontSize: 11, fontFamily: Fonts.statusBold, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 4 }}>
                      Recommended actions
                    </Text>
                    {topic.actions.map((action) => (
                      <View key={action} style={{ flexDirection: 'row', gap: 8 }}>
                        <Text style={{ color: palette.accent, fontSize: 13, fontFamily: Fonts.bodyBold }}>•</Text>
                        <Text style={{ flex: 1, color: palette.textMuted, fontSize: 13, fontFamily: Fonts.body, lineHeight: 19 }}>{action}</Text>
                      </View>
                    ))}
                    <Pressable
                      onPress={() => toggleSpeech(topic)}
                      style={({ pressed }) => ({
                        marginTop: 6,
                        minHeight: 40,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        borderWidth: 1,
                        borderColor: palette.border,
                        backgroundColor: palette.surfaceMuted,
                        opacity: pressed ? 0.78 : 1,
                      })}
                    >
                      <Ionicons name={speaking ? 'stop-outline' : 'volume-high-outline'} size={17} color={palette.text} />
                      <Text style={{ color: palette.text, fontSize: 12, fontFamily: Fonts.statusBold, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                        {speaking ? 'Stop' : 'Listen'}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}
              </Surface>
            );
          })
        )}
      </View>
    </ScreenScroll>
  );
}
