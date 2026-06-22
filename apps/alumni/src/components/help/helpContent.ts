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

export const alumniTourSteps: TourStep[] = [
  {
    title: 'Welcome to your alumni workspace',
    body: 'This dashboard collects your dues, news, events, projects, forum activity, and personal membership tools.',
    selector: '[data-tour="main-content"]',
  },
  {
    title: 'Move through the portal',
    body: 'The sidebar groups everything by content, finance, community, governance, and support so common tasks stay easy to find.',
    selector: '[data-tour="sidebar"]',
  },
  {
    title: 'Use the topbar',
    body: 'The topbar keeps search, theme, notifications, and your account menu available while you work.',
    selector: '[data-tour="topbar"]',
  },
  {
    title: 'Track activity',
    body: 'Notifications surface new community updates and important membership activity.',
    selector: '[data-tour="notifications"]',
  },
  {
    title: 'Open help anytime',
    body: 'Your account menu includes page help, this replayable tour, and the help library with text-to-speech.',
    selector: '[data-tour="user-menu"]',
  },
]

export const alumniHelpTopics: HelpTopic[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    routeLabel: 'Dashboard',
    paths: ['/dashboard', '/'],
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
    startsWith: ['/profile'],
    summary: 'Your member identity, contact details, class information, and public profile data.',
    sections: ['Keep your name, year group, occupation, and contact details accurate.', 'Profile completeness helps classmates and the association reach you.'],
    actions: ['Update incomplete details.', 'Refresh your photo when needed.'],
  },
  {
    id: 'news',
    title: 'News',
    routeLabel: 'News',
    startsWith: ['/news'],
    summary: 'Association stories, official updates, dispatches, and articles for members.',
    sections: ['Use the list to browse recent posts.', 'Open a detail page for the full story and related context.'],
    actions: ['Read featured updates.', 'Share important dispatches with your year group.'],
  },
  {
    id: 'events',
    title: 'Events',
    routeLabel: 'Events',
    startsWith: ['/events'],
    summary: 'Upcoming and past gatherings, homecomings, meetings, and school or alumni activities.',
    sections: ['Event cards show timing and location.', 'Detail pages provide RSVP or attendance context when available.'],
    actions: ['RSVP early when a response is needed.', 'Check event details before traveling.'],
  },
  {
    id: 'projects',
    title: 'Projects',
    routeLabel: 'Projects',
    startsWith: ['/projects'],
    summary: 'Association initiatives, fundraising goals, progress, and completed community work.',
    sections: ['Project pages show what the association is building or supporting.', 'Progress details help members understand funding needs and milestones.'],
    actions: ['Support active projects.', 'Review completed work for impact context.'],
  },
  {
    id: 'donations',
    title: 'Donations',
    routeLabel: 'Donations',
    startsWith: ['/donations'],
    summary: 'A place to give voluntary support through available donation rails.',
    sections: ['Choose a donation amount and payment route.', 'Donation history helps you track giving when records are available.'],
    actions: ['Use a verified payment method.', 'Check references before submitting manual payment records.'],
  },
  {
    id: 'dues',
    title: 'My Dues',
    routeLabel: 'Dues',
    startsWith: ['/dues'],
    summary: 'Your membership dues status, payment options, and related records.',
    sections: ['Use this page to confirm what is due.', 'Payment actions help keep your membership standing current.'],
    actions: ['Pay outstanding dues.', 'Review the period before submitting payment.'],
  },
  {
    id: 'jobs',
    title: 'Jobs Board',
    routeLabel: 'Jobs',
    startsWith: ['/jobs'],
    summary: 'Career opportunities shared by alumni, partners, and the community.',
    sections: ['Browse openings and details.', 'Job detail pages show requirements, contacts, and application guidance.'],
    actions: ['Apply to relevant roles.', 'Share credible opportunities with the community.'],
  },
  {
    id: 'mentorship',
    title: 'Mentorship',
    routeLabel: 'Mentorship',
    startsWith: ['/mentorship'],
    summary: 'Connect with alumni who can guide students and younger members.',
    sections: ['Mentor profiles show expertise and availability.', 'Requests help start structured guidance conversations.'],
    actions: ['Request a fitting mentor.', 'Keep your own mentor availability updated if you volunteer.'],
  },
  {
    id: 'directory',
    title: 'Directory',
    routeLabel: 'Directory',
    startsWith: ['/members'],
    summary: 'Find classmates, year groups, and alumni contacts inside the member community.',
    sections: ['Use filters and search to narrow the list.', 'Member profile pages show public professional and class information.'],
    actions: ['Search by name, class, or profession.', 'Respect member privacy when reaching out.'],
  },
  {
    id: 'forum',
    title: 'Forum',
    routeLabel: 'Forum',
    startsWith: ['/forum'],
    summary: 'Member discussions, replies, announcements, and community conversations.',
    sections: ['Browse topics from the list.', 'Detail pages hold the thread and replies.'],
    actions: ['Contribute respectfully.', 'Follow active discussions you care about.'],
  },
  {
    id: 'polls',
    title: 'Polls',
    routeLabel: 'Polls',
    startsWith: ['/polls'],
    summary: 'Quick member feedback and association pulse checks.',
    sections: ['Active polls are available for voting.', 'Results may show how members are responding.'],
    actions: ['Vote before polls close.', 'Use results as community feedback, not formal election outcomes.'],
  },
  {
    id: 'elections',
    title: 'Elections',
    routeLabel: 'Elections',
    startsWith: ['/elections'],
    summary: 'Formal association elections, candidates, voting windows, and results.',
    sections: ['Election cards show open or upcoming votes.', 'Candidate details help you decide before voting.'],
    actions: ['Review candidates carefully.', 'Vote only during active windows.'],
  },
  {
    id: 'requests',
    title: 'Requests',
    routeLabel: 'Requests',
    startsWith: ['/requests'],
    summary: 'Service forms for transcript support, recommendations, and related membership help.',
    sections: ['Choose the correct request type before filling the form.', 'Complete details help the team process requests faster.'],
    actions: ['Submit accurate information.', 'Use contact if you need clarification before requesting.'],
  },
  {
    id: 'contact',
    title: 'Contact',
    routeLabel: 'Contact',
    startsWith: ['/contact'],
    summary: 'Reach the association team for support, enquiries, and service follow-up.',
    sections: ['Use this page for questions that do not fit a structured request.', 'Include clear contact details and context.'],
    actions: ['Send concise messages.', 'Use request forms when the issue has a dedicated process.'],
  },
  {
    id: 'settings',
    title: 'Settings',
    routeLabel: 'Settings',
    startsWith: ['/settings'],
    summary: 'Account preferences, security, notifications, and portal settings.',
    sections: ['Settings affect your personal portal account.', 'Notification choices control how you receive updates.'],
    actions: ['Keep your account secure.', 'Review notification preferences after joining.'],
  },
  {
    id: 'gallery',
    title: 'Gallery',
    routeLabel: 'Gallery',
    startsWith: ['/gallery'],
    summary: 'Photos and collections from school life, alumni gatherings, projects, and events.',
    sections: ['Browse categories for different moments.', 'Images help preserve association history.'],
    actions: ['Explore recent collections.', 'Share strong archive material with the association team.'],
  },
  {
    id: 'help',
    title: 'Help Library',
    routeLabel: 'Help',
    startsWith: ['/help'],
    summary: 'A page-by-page guide to the alumni portal, with text-to-speech controls.',
    sections: ['Use page help from the profile menu for the current screen.', 'Use the library when you want a broader explanation.'],
    actions: ['Replay the dashboard tour anytime.', 'Use listen controls for spoken guidance.'],
  },
]

export function getAlumniHelpTopic(pathname: string): HelpTopic {
  return (
    alumniHelpTopics.find((topic) => topic.paths?.includes(pathname)) ??
    alumniHelpTopics.find((topic) => topic.startsWith?.some((prefix) => pathname.startsWith(prefix))) ??
    alumniHelpTopics[0]
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
