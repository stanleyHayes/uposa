export interface HelpTopic {
  id: string
  title: string
  routeLabel: string
  summary: string
  sections: string[]
  actions: string[]
  paths?: string[]
  startsWith?: string[]
}

export interface TourStep {
  title: string
  body: string
  selector?: string
}

export const adminTourSteps: TourStep[] = [
  {
    title: 'Welcome to the secretariat console',
    body: 'This dashboard gives you the platform snapshot: members, money, content, queues, and recent operations in one place.',
    selector: '[data-tour="main-content"]',
  },
  {
    title: 'Use the left navigation',
    body: 'The sidebar groups every admin workspace by responsibility: content, community, members, and administration.',
    selector: '[data-tour="sidebar"]',
  },
  {
    title: 'Scan and act from the top',
    body: 'The topbar keeps search, theme, notifications, and your account menu within reach while you work.',
    selector: '[data-tour="topbar"]',
  },
  {
    title: 'Watch notifications',
    body: 'Registration requests, donations, messages, and new activity appear here so urgent work does not get missed.',
    selector: '[data-tour="notifications"]',
  },
  {
    title: 'Open help anytime',
    body: 'Your profile menu now holds page help, this replayable tour, and the full help library with text-to-speech.',
    selector: '[data-tour="user-menu"]',
  },
]

export const adminHelpTopics: HelpTopic[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    routeLabel: 'Dashboard',
    paths: ['/dashboard', '/'],
    summary: 'A command snapshot of the entire platform across membership, finance, content, engagement, and open admin work.',
    sections: [
      'Use the hero and KPI cards to see platform health quickly.',
      'Review the operational queue for work that needs attention.',
      'Use charts to understand recent registrations, giving, content, events, and engagement.',
    ],
    actions: ['Review pending queues first.', 'Use quick actions to create news, events, polls, or site updates.'],
  },
  {
    id: 'alumni-registrations',
    title: 'Alumni Registrations',
    routeLabel: 'Registrations',
    startsWith: ['/alumni-registrations'],
    summary: 'Review new alumni accounts, inspect details, and approve or manage membership access.',
    sections: ['Pending alumni appear here for verification.', 'Detail pages help confirm identity, class, contact, and profile data.'],
    actions: ['Approve verified alumni.', 'Follow up on incomplete or suspicious profiles.'],
  },
  {
    id: 'members',
    title: 'Members Directory',
    routeLabel: 'Members',
    startsWith: ['/members'],
    summary: 'Search and manage active alumni records across class years, contact details, and member status.',
    sections: ['Use filters and search to find members.', 'Open a member profile when you need deeper record context.'],
    actions: ['Keep records current.', 'Use this page before membership outreach or support work.'],
  },
  {
    id: 'events',
    title: 'Events',
    routeLabel: 'Events',
    startsWith: ['/events'],
    summary: 'Create, edit, and monitor association events, homecomings, gatherings, and RSVP activity.',
    sections: ['The list shows event status and timing.', 'Event forms control public event pages and details.'],
    actions: ['Create upcoming events.', 'Archive or update events when schedules change.'],
  },
  {
    id: 'news',
    title: 'News and Articles',
    routeLabel: 'News',
    startsWith: ['/news'],
    summary: 'Publish public dispatches, updates, articles, meeting summaries, and reports.',
    sections: ['Drafts stay internal until published.', 'Detail pages show article content before editing or publishing decisions.'],
    actions: ['Post timely updates.', 'Use featured status for important stories.'],
  },
  {
    id: 'announcements',
    title: 'Announcements',
    routeLabel: 'Announcements',
    startsWith: ['/announcements'],
    summary: 'Manage concise official notices that should be visible to the community.',
    sections: ['Announcements work best for direct, time-sensitive messages.', 'Use detail pages to review the exact notice before edits.'],
    actions: ['Publish notices clearly.', 'Retire or edit stale announcements.'],
  },
  {
    id: 'projects',
    title: 'Projects',
    routeLabel: 'Projects',
    startsWith: ['/projects'],
    summary: 'Track UPOSA initiatives, fundraising progress, milestones, and public project narratives.',
    sections: ['Projects can carry funding goals, raised amounts, and milestones.', 'Completed or paused projects should be updated so public pages stay accurate.'],
    actions: ['Update milestones.', 'Keep fundraising totals and project status current.'],
  },
  {
    id: 'donations',
    title: 'Donations',
    routeLabel: 'Donations',
    startsWith: ['/donations'],
    summary: 'Review, create, reconcile, and confirm donation records across manual and online channels.',
    sections: ['Pending gifts need confirmation.', 'Donation detail pages show donor, channel, amount, and references.'],
    actions: ['Confirm verified payments.', 'Record manual gifts from approved rails.'],
  },
  {
    id: 'payment-methods',
    title: 'Payment Methods',
    routeLabel: 'Payment Methods',
    startsWith: ['/payment-methods'],
    summary: 'Configure the donation and payment rails available to members and public donors.',
    sections: ['Enabled methods can appear in payment flows.', 'Provider settings control supported currencies and availability.'],
    actions: ['Disable broken rails quickly.', 'Verify credentials before enabling online providers.'],
  },
  {
    id: 'jobs',
    title: 'Jobs',
    routeLabel: 'Jobs',
    startsWith: ['/jobs'],
    summary: 'Moderate alumni job posts and review applications flowing through the community job board.',
    sections: ['Pending jobs need admin review before broad visibility.', 'Job detail pages expose applications and post information.'],
    actions: ['Approve legitimate opportunities.', 'Remove stale or unsuitable listings.'],
  },
  {
    id: 'forum',
    title: 'Forum',
    routeLabel: 'Forum',
    startsWith: ['/forum'],
    summary: 'Moderate member discussions, replies, pinned posts, and locked threads.',
    sections: ['Forum health depends on timely moderation.', 'Detail panels show post content and replies.'],
    actions: ['Pin important discussions.', 'Lock or remove content when needed.'],
  },
  {
    id: 'polls',
    title: 'Polls',
    routeLabel: 'Polls',
    startsWith: ['/polls'],
    summary: 'Create and manage quick member polls and review results.',
    sections: ['Active polls collect member votes.', 'Poll detail pages show options, totals, and voting activity.'],
    actions: ['Close finished polls.', 'Use polls for low-friction member feedback.'],
  },
  {
    id: 'elections',
    title: 'Elections',
    routeLabel: 'Elections',
    startsWith: ['/elections'],
    summary: 'Manage formal association elections, candidates, status, and voting windows.',
    sections: ['Election status controls whether members can vote.', 'Detail pages show candidate and vote result context.'],
    actions: ['Confirm dates carefully.', 'Publish election changes clearly.'],
  },
  {
    id: 'executives',
    title: 'Executives',
    routeLabel: 'Executives',
    startsWith: ['/executives'],
    summary: 'Manage association executive profiles shown across the platform.',
    sections: ['Executive records include role, class, contact, biography, and photo.', 'Ordering controls how profiles appear publicly.'],
    actions: ['Keep current officers active.', 'Archive inactive or old records.'],
  },
  {
    id: 'school-leaders',
    title: 'School Leaders',
    routeLabel: 'School Leaders',
    startsWith: ['/school-leaders'],
    summary: 'Maintain school leadership records for public history and institutional context.',
    sections: ['Use this area for leadership profiles and ordering.', 'Photos and roles help the public understand school governance.'],
    actions: ['Keep profiles accurate.', 'Deactivate outdated entries.'],
  },
  {
    id: 'about-content',
    title: 'About Content',
    routeLabel: 'About Content',
    startsWith: ['/about-content'],
    summary: 'Edit structured content that powers the public About and association information pages.',
    sections: ['This page controls public-facing narrative blocks.', 'Changes should be reviewed for accuracy and tone.'],
    actions: ['Update only verified association information.', 'Check public pages after major edits.'],
  },
  {
    id: 'contact-messages',
    title: 'Contact Messages',
    routeLabel: 'Contact Messages',
    startsWith: ['/contact-messages'],
    summary: 'Read, triage, and respond to public enquiries and service requests.',
    sections: ['Unread messages are a priority queue.', 'Some messages may be transcript or membership support requests.'],
    actions: ['Mark handled messages read.', 'Escalate requests that need school or executive input.'],
  },
  {
    id: 'newsletter',
    title: 'Newsletter',
    routeLabel: 'Newsletter',
    startsWith: ['/newsletter'],
    summary: 'Manage newsletter subscribers and the communication audience.',
    sections: ['Active subscribers can receive association updates.', 'Use this list to monitor community reach.'],
    actions: ['Keep subscriber status clean.', 'Use respectful communication cadences.'],
  },
  {
    id: 'gallery',
    title: 'Gallery',
    routeLabel: 'Gallery',
    startsWith: ['/gallery'],
    summary: 'Manage public gallery categories and images from school and alumni moments.',
    sections: ['Categories organize collections.', 'Items should have clear titles and useful context.'],
    actions: ['Add strong representative images.', 'Remove broken or low-quality media.'],
  },
  {
    id: 'roles',
    title: 'Roles and Permissions',
    routeLabel: 'Roles',
    startsWith: ['/roles'],
    summary: 'Review admin role boundaries and what each role can access.',
    sections: ['Roles protect sensitive platform areas.', 'Use this page to understand capability differences.'],
    actions: ['Assign the least privilege needed.', 'Review access before adding new admins.'],
  },
  {
    id: 'admin-users',
    title: 'Admin Users',
    routeLabel: 'Admin Users',
    startsWith: ['/admin-users'],
    summary: 'Create and manage administrator accounts.',
    sections: ['Admin users can operate sensitive areas depending on role.', 'Inactive admins should not retain access.'],
    actions: ['Deactivate accounts no longer needed.', 'Use strong passwords and appropriate roles.'],
  },
  {
    id: 'site-config',
    title: 'Site Configuration',
    routeLabel: 'Site Config',
    startsWith: ['/site-config'],
    summary: 'Control structured public website settings, history content, and shared configuration.',
    sections: ['This is a high-impact public-content area.', 'Preview public-facing changes after editing.'],
    actions: ['Keep configuration intentional.', 'Review history and content tabs before saving.'],
  },
  {
    id: 'settings',
    title: 'Settings',
    routeLabel: 'Settings',
    startsWith: ['/settings'],
    summary: 'Manage your admin profile, preferences, notifications, and account safety options.',
    sections: ['Profile settings affect your admin account.', 'Notification preferences control how alerts appear.'],
    actions: ['Keep contact information current.', 'Use account safety controls carefully.'],
  },
  {
    id: 'help',
    title: 'Help Library',
    routeLabel: 'Help',
    startsWith: ['/help'],
    summary: 'A searchable guide to what each admin page does, with text-to-speech support.',
    sections: ['Use page help for the current screen.', 'Use the library when you want a broader tour of the console.'],
    actions: ['Replay the dashboard tour anytime.', 'Use listen controls when you want the page explained aloud.'],
  },
]

export function getAdminHelpTopic(pathname: string): HelpTopic {
  return (
    adminHelpTopics.find((topic) => topic.paths?.includes(pathname)) ??
    adminHelpTopics.find((topic) => topic.startsWith?.some((prefix) => pathname.startsWith(prefix))) ??
    adminHelpTopics[0]
  )
}

export function topicToSpeech(topic: HelpTopic): string {
  return [
    topic.title,
    topic.summary,
    ...topic.sections,
    'Recommended actions.',
    ...topic.actions,
  ].join('. ')
}
