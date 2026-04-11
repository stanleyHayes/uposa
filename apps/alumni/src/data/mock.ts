/**
 * Fallback data used when the API is unavailable.
 *
 * Every page attempts to fetch live data from the API first. If the request
 * fails (network error, server down, etc.) the page falls back to these
 * values so the UI is never completely empty during development or outages.
 */
import type {
  Event, News, Project, Donation, Due, Job, ForumPost, Poll, Election, Member,
} from '../types'

export const MOCK_EVENTS: Event[] = [
  {
    id: '1', title: 'Annual General Meeting 2026', slug: 'agm-2026',
    description: 'Join us for the Annual General Meeting where we review the past year and plan ahead. All members are encouraged to attend and contribute to discussions about the future of UPOSA.\n\nAgenda includes:\n- Financial report review\n- Executive elections\n- Project updates\n- New initiatives proposals',
    date: '2026-04-15T10:00:00Z', endDate: '2026-04-15T16:00:00Z',
    location: 'UPOSA Conference Hall, Wa', status: 'UPCOMING', isFeatured: true,
    imageUrl: 'https://picsum.photos/seed/agm2026/600/400',
    createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-10T00:00:00Z',
  },
  {
    id: '2', title: 'Homecoming & Reunion Weekend', slug: 'homecoming-2026',
    description: 'Reconnect with old friends and relive memories at the 2026 Homecoming Weekend. Activities include campus tours, cultural performances, and a grand dinner.',
    date: '2026-06-20T09:00:00Z', endDate: '2026-06-22T18:00:00Z',
    location: 'UPOSA Campus, Wa', status: 'UPCOMING', isFeatured: true,
    imageUrl: 'https://picsum.photos/seed/homecoming/600/400',
    createdAt: '2026-02-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: '3', title: 'Career Networking Night', slug: 'career-night-2026',
    description: 'An evening of professional networking for alumni. Meet industry leaders, explore career opportunities, and build lasting connections.',
    date: '2026-05-10T18:00:00Z',
    location: 'Accra City Hotel, Accra', status: 'UPCOMING', isFeatured: false,
    imageUrl: 'https://picsum.photos/seed/careernight/600/400',
    createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-02-15T00:00:00Z',
  },
  {
    id: '4', title: 'NSMQ Watch Party', slug: 'nsmq-watch-2025',
    description: 'We gathered to cheer on our school at the National Science & Maths Quiz! What a night of excitement and school pride.',
    date: '2025-11-15T14:00:00Z',
    location: 'Online & Wa Sports Bar', status: 'PAST', isFeatured: false,
    imageUrl: 'https://picsum.photos/seed/nsmqwatch/600/400',
    createdAt: '2025-10-01T00:00:00Z', updatedAt: '2025-11-16T00:00:00Z',
  },
  {
    id: '5', title: 'End of Year Fundraiser Gala', slug: 'gala-2025',
    description: 'Our annual fundraiser gala raised GHS 45,000 for the school library project. Thank you to all donors and attendees!',
    date: '2025-12-18T19:00:00Z',
    location: 'Golden Tulip, Kumasi', status: 'PAST', isFeatured: false,
    imageUrl: 'https://picsum.photos/seed/gala2025/600/400',
    createdAt: '2025-11-01T00:00:00Z', updatedAt: '2025-12-19T00:00:00Z',
  },
]

export const MOCK_NEWS: News[] = [
  {
    id: '1', title: 'UPOSA Launches New Scholarship Fund for Underprivileged Students',
    slug: 'scholarship-fund-launch',
    content: 'The Union of POSA Alumni is proud to announce a new scholarship fund aimed at supporting underprivileged students from the Upper West Region. The fund, seeded with GHS 50,000 from alumni donations, will provide full scholarships covering tuition, books, and living expenses for 10 students annually.\n\nApplications open in April 2026. Eligible students must demonstrate academic excellence and financial need. Former beneficiaries of UPOSA programs will be given priority.\n\nWe call on all alumni to contribute to this worthy cause and help shape the future of our community.',
    excerpt: 'A new GHS 50,000 scholarship fund will support 10 underprivileged students annually.',
    category: 'ANNOUNCEMENT', authorName: 'UPOSA Executive', isFeatured: true, isPublished: true,
    publishedAt: '2026-03-10T00:00:00Z',
    imageUrl: 'https://picsum.photos/seed/scholarship/600/400',
    createdAt: '2026-03-10T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z',
  },
  {
    id: '2', title: 'Alumni Spotlight: Dr. Amina Yakubu\'s Journey from UPOSA to WHO',
    slug: 'alumni-spotlight-amina',
    content: 'Dr. Amina Yakubu, Class of 2005, has been appointed as a regional advisor at the World Health Organization. Her journey from the classrooms of UPOSA to the halls of the WHO is an inspiration to all current students and alumni.\n\n"UPOSA gave me the foundation I needed," she says. "The discipline, the community, and the values I learned there shaped everything I\'ve become."\n\nDr. Yakubu specializes in tropical disease research and has published over 40 peer-reviewed papers.',
    excerpt: 'Class of 2005 graduate appointed as WHO regional advisor.',
    category: 'BLOG', authorName: 'Editorial Team', isFeatured: true, isPublished: true,
    publishedAt: '2026-03-05T00:00:00Z',
    imageUrl: 'https://picsum.photos/seed/spotlight/600/400',
    createdAt: '2026-03-05T00:00:00Z', updatedAt: '2026-03-05T00:00:00Z',
  },
  {
    id: '3', title: 'Minutes: February 2026 Executive Meeting',
    slug: 'feb-2026-minutes',
    content: 'Key decisions from the February 2026 executive meeting:\n\n1. Approved budget for school laboratory renovation (GHS 80,000)\n2. Set date for AGM 2026 - April 15th\n3. Launched mentorship matching program\n4. Approved 3 new job board partnerships\n5. Reviewed membership dues collection - 67% compliance rate\n\nFull minutes available in the members-only section.',
    excerpt: 'Key decisions including lab renovation budget and AGM date.',
    category: 'MEETING_SUMMARY', authorName: 'Secretary', isFeatured: false, isPublished: true,
    publishedAt: '2026-02-28T00:00:00Z',
    createdAt: '2026-02-28T00:00:00Z', updatedAt: '2026-02-28T00:00:00Z',
  },
  {
    id: '4', title: 'UPOSA School Wins Regional Science Competition',
    slug: 'science-competition-win',
    content: 'Our school has won first place in the Upper West Regional Science and Innovation Competition! The team of three students presented a solar-powered water purification system that impressed the judges.\n\nThe alumni association contributed GHS 5,000 towards equipment and mentorship for the students.',
    excerpt: 'Students win with solar-powered water purification project.',
    category: 'ANNOUNCEMENT', authorName: 'UPOSA PR', isFeatured: false, isPublished: true,
    publishedAt: '2026-02-15T00:00:00Z',
    imageUrl: 'https://picsum.photos/seed/sciencewin/600/400',
    createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-02-15T00:00:00Z',
  },
]

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1', title: 'School Library Renovation', slug: 'library-renovation',
    description: 'Complete renovation of the school library including new shelving, 500+ new books, digital reading stations, and air conditioning. This project aims to create a modern learning environment for current students.',
    goalAmount: 120000, raisedAmount: 87500, status: 'ONGOING', isFeatured: true,
    startDate: '2025-09-01T00:00:00Z', endDate: '2026-08-31T00:00:00Z',
    imageUrl: 'https://picsum.photos/seed/library/600/400',
    createdAt: '2025-09-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: '2', title: 'Science Laboratory Equipment', slug: 'lab-equipment',
    description: 'Procuring modern science laboratory equipment including microscopes, chemical sets, and safety gear for the chemistry, biology, and physics labs.',
    goalAmount: 80000, raisedAmount: 42000, status: 'ONGOING', isFeatured: true,
    startDate: '2026-01-15T00:00:00Z',
    imageUrl: 'https://picsum.photos/seed/labequip/600/400',
    createdAt: '2026-01-15T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: '3', title: 'School Borehole Project', slug: 'borehole-project',
    description: 'Successfully drilled and installed a borehole to provide clean water for the school and surrounding community. Serves over 2,000 people daily.',
    goalAmount: 45000, raisedAmount: 45000, status: 'COMPLETED', isFeatured: false,
    startDate: '2025-03-01T00:00:00Z', endDate: '2025-07-30T00:00:00Z',
    imageUrl: 'https://picsum.photos/seed/borehole/600/400',
    createdAt: '2025-03-01T00:00:00Z', updatedAt: '2025-07-30T00:00:00Z',
  },
]

export const MOCK_DONATIONS: Donation[] = [
  { id: '1', donorName: 'Kwame Mensah', donorEmail: 'kwame@uposa.org', amount: 500, currency: 'GHS', channel: 'MOMO', purpose: 'Library Renovation', status: 'CONFIRMED', createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-02-15T00:00:00Z' },
  { id: '2', donorName: 'Kwame Mensah', donorEmail: 'kwame@uposa.org', amount: 200, currency: 'GHS', channel: 'MOMO', purpose: 'General Fund', status: 'CONFIRMED', createdAt: '2025-12-01T00:00:00Z', updatedAt: '2025-12-01T00:00:00Z' },
  { id: '3', donorName: 'Kwame Mensah', donorEmail: 'kwame@uposa.org', amount: 1000, currency: 'GHS', channel: 'BANK', purpose: 'Science Lab Equipment', status: 'PENDING', transactionRef: 'GCB-20260310-001', createdAt: '2026-03-10T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z' },
]

export const MOCK_DUES: Due[] = [
  { id: '1', memberId: 'demo-kwame@uposa.org', amount: 120, year: 2026, status: 'PENDING', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', memberId: 'demo-kwame@uposa.org', amount: 120, year: 2025, status: 'PAID', paidAt: '2025-03-15T00:00:00Z', transactionRef: 'MOMO-2025-0315', createdAt: '2025-01-01T00:00:00Z', updatedAt: '2025-03-15T00:00:00Z' },
  { id: '3', memberId: 'demo-kwame@uposa.org', amount: 120, year: 2024, status: 'PAID', paidAt: '2024-06-20T00:00:00Z', transactionRef: 'MOMO-2024-0620', createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-06-20T00:00:00Z' },
  { id: '4', memberId: 'demo-kwame@uposa.org', amount: 120, year: 2023, status: 'OVERDUE', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-12-31T00:00:00Z' },
]

export const MOCK_JOBS: Job[] = [
  {
    id: '1', title: 'Software Engineer', company: 'MTN Ghana', location: 'Accra, Ghana',
    jobType: 'FULL_TIME', description: 'We are looking for a skilled software engineer to join our digital transformation team. You will work on mobile money infrastructure serving millions of users.\n\nRequirements:\n- 3+ years experience in Python or Java\n- Experience with microservices architecture\n- Strong problem-solving skills\n- BSc in Computer Science or related field',
    contactEmail: 'careers@mtn.com.gh', isApproved: true, postedById: 'demo-kwame@uposa.org',
    postedBy: { id: 'demo-kwame@uposa.org', fullName: 'Kwame Mensah', photoUrl: undefined },
    createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: '2', title: 'Marketing Manager', company: 'Melcom Group', location: 'Kumasi, Ghana',
    jobType: 'FULL_TIME', description: 'Lead our marketing efforts across retail locations. Oversee campaigns, digital strategy, and brand management.\n\nRequirements:\n- 5+ years marketing experience\n- Retail industry knowledge preferred\n- Strong leadership and communication skills',
    contactEmail: 'hr@melcom.com', isApproved: true, postedById: 'demo-abena@uposa.org',
    postedBy: { id: 'demo-abena@uposa.org', fullName: 'Abena Osei', photoUrl: undefined },
    expiresAt: '2026-04-30T00:00:00Z',
    createdAt: '2026-02-20T00:00:00Z', updatedAt: '2026-02-20T00:00:00Z',
  },
  {
    id: '3', title: 'Teaching Volunteer', company: 'UPOSA School', location: 'Wa, Upper West',
    jobType: 'VOLUNTEER', description: 'Volunteer to teach Mathematics or Science at your alma mater. Help shape the next generation of leaders.\n\nCommitment: 2 weeks minimum during school term\nAccommodation provided',
    isApproved: true, postedById: 'demo-kofi@uposa.org',
    postedBy: { id: 'demo-kofi@uposa.org', fullName: 'Kofi Asante', photoUrl: undefined },
    createdAt: '2026-02-10T00:00:00Z', updatedAt: '2026-02-10T00:00:00Z',
  },
  {
    id: '4', title: 'Accounting Intern', company: 'PwC Ghana', location: 'Accra, Ghana',
    jobType: 'INTERNSHIP', description: 'Summer internship for accounting and finance graduates. Gain hands-on experience at one of the Big Four.\n\n3-month program starting June 2026.',
    contactEmail: 'internships@pwc.com.gh', isApproved: true, postedById: 'demo-abena@uposa.org',
    postedBy: { id: 'demo-abena@uposa.org', fullName: 'Abena Osei', photoUrl: undefined },
    expiresAt: '2026-05-15T00:00:00Z',
    createdAt: '2026-03-05T00:00:00Z', updatedAt: '2026-03-05T00:00:00Z',
  },
]

export const MOCK_FORUM_POSTS: ForumPost[] = [
  {
    id: '1', title: 'How can we improve NSMQ preparation?', slug: 'nsmq-preparation',
    content: 'I think we as alumni should organize weekend coaching sessions for NSMQ candidates. We have many scientists and mathematicians in our network. What do you all think?',
    category: 'EDUCATION', authorId: 'demo-kwame@uposa.org',
    author: { id: 'demo-kwame@uposa.org', fullName: 'Kwame Mensah', photoUrl: undefined },
    viewCount: 142, isPinned: true, isLocked: false,
    _count: { comments: 23 },
    createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-12T00:00:00Z',
  },
  {
    id: '2', title: 'Class of 2015 Reunion Planning', slug: 'class-2015-reunion',
    content: 'Hey 2015 year group! Let\'s start planning our reunion. I suggest we do it during Homecoming Weekend in June. Who\'s in?',
    category: 'GENERAL', authorId: 'demo-abena@uposa.org',
    author: { id: 'demo-abena@uposa.org', fullName: 'Abena Osei', photoUrl: undefined },
    viewCount: 89, isPinned: false, isLocked: false,
    _count: { comments: 15 },
    createdAt: '2026-02-28T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z',
  },
  {
    id: '3', title: 'Job referral opportunities at tech companies', slug: 'tech-referrals',
    content: 'I work at Google and can refer alumni for open positions. Currently hiring SWE, PM, and UX roles in Accra office. DM me if interested.',
    category: 'CAREERS', authorId: 'demo-kofi@uposa.org',
    author: { id: 'demo-kofi@uposa.org', fullName: 'Kofi Asante', photoUrl: undefined },
    viewCount: 234, isPinned: false, isLocked: false,
    _count: { comments: 31 },
    createdAt: '2026-02-20T00:00:00Z', updatedAt: '2026-03-08T00:00:00Z',
  },
  {
    id: '4', title: 'Welfare support for sick members', slug: 'welfare-support',
    content: 'A reminder that UPOSA has a welfare fund for members facing health challenges. If you know anyone who needs support, please contact the welfare committee.',
    category: 'WELFARE', authorId: 'demo-kwame@uposa.org',
    author: { id: 'demo-kwame@uposa.org', fullName: 'Kwame Mensah', photoUrl: undefined },
    viewCount: 67, isPinned: false, isLocked: false,
    _count: { comments: 8 },
    createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-02-20T00:00:00Z',
  },
  {
    id: '5', title: 'Annual dues - why GHS 120 matters', slug: 'dues-importance',
    content: 'Some members ask why we collect annual dues. Here\'s a breakdown of how your GHS 120 is used:\n- 40% goes to school projects\n- 25% for welfare support\n- 20% for events and administration\n- 15% for emergency fund\n\nEvery cedi counts!',
    category: 'ANNOUNCEMENTS', authorId: 'demo-abena@uposa.org',
    author: { id: 'demo-abena@uposa.org', fullName: 'Abena Osei', photoUrl: undefined },
    viewCount: 198, isPinned: true, isLocked: false,
    _count: { comments: 12 },
    createdAt: '2026-01-10T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z',
  },
]

export const MOCK_POLLS: Poll[] = [
  {
    id: '1', question: 'What should be the theme for Homecoming 2026?',
    description: 'Help us choose the theme for this year\'s homecoming celebration.',
    options: [
      { id: 1, text: 'Legacy & Innovation', votes: 45 },
      { id: 2, text: 'Together We Rise', votes: 38 },
      { id: 3, text: 'Roots & Wings', votes: 52 },
      { id: 4, text: 'Pride of the North', votes: 29 },
    ],
    allowMultiple: false, status: 'ACTIVE',
    endsAt: '2026-04-01T00:00:00Z',
    createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z',
  },
  {
    id: '2', question: 'Which project should we prioritize next?',
    description: 'We have funds for one major project. Choose the most impactful.',
    options: [
      { id: 1, text: 'Computer Lab (30 desktops)', votes: 67 },
      { id: 2, text: 'Sports Field Renovation', votes: 43 },
      { id: 3, text: 'Girls\' Dormitory Extension', votes: 55 },
    ],
    allowMultiple: false, status: 'ACTIVE',
    endsAt: '2026-03-31T00:00:00Z',
    createdAt: '2026-02-15T00:00:00Z', updatedAt: '2026-02-15T00:00:00Z',
  },
  {
    id: '3', question: 'Best communication channels for alumni updates',
    description: 'Select all platforms you actively use.',
    options: [
      { id: 1, text: 'WhatsApp', votes: 156 },
      { id: 2, text: 'Email', votes: 89 },
      { id: 3, text: 'This Portal', votes: 72 },
      { id: 4, text: 'Facebook', votes: 45 },
      { id: 5, text: 'Twitter/X', votes: 23 },
    ],
    allowMultiple: true, status: 'CLOSED',
    createdAt: '2025-12-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    hasVoted: true, myVote: [1, 3],
  },
]

export const MOCK_ELECTIONS: Election[] = [
  {
    id: '1', title: 'UPOSA President 2026-2028', position: 'President',
    description: 'Vote for the next UPOSA President who will lead the association for the next two years.',
    candidates: [
      { id: 'c1', name: 'Dr. Emmanuel Dery', manifesto: 'My vision is to digitize all UPOSA operations, increase membership by 50%, and establish a permanent office in Accra. I bring 10 years of leadership experience.', votes: 0 },
      { id: 'c2', name: 'Madam Felicia Kuupol', manifesto: 'I will focus on welfare, mentorship programs, and strengthening ties with the school administration. Education and community first.', votes: 0 },
      { id: 'c3', name: 'Mr. Isaac Bayuo', manifesto: 'My priority is fundraising for school infrastructure and creating job opportunities for young alumni. Let\'s build together.', votes: 0 },
    ],
    status: 'ACTIVE', startDate: '2026-03-10T00:00:00Z', endDate: '2026-04-10T00:00:00Z',
    createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-10T00:00:00Z',
  },
  {
    id: '2', title: 'Treasurer 2026-2028', position: 'Treasurer',
    description: 'Select the next Treasurer to manage UPOSA finances.',
    candidates: [
      { id: 'c4', name: 'Mr. Abdul-Razak Salifu', manifesto: 'Transparency and accountability. I will publish quarterly financial reports and establish an audit committee.', votes: 0 },
      { id: 'c5', name: 'Mrs. Grace Tampuri', manifesto: 'I will diversify our revenue streams and ensure every member can track how their dues are used.', votes: 0 },
    ],
    status: 'UPCOMING', startDate: '2026-04-15T00:00:00Z', endDate: '2026-05-15T00:00:00Z',
    createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z',
  },
]

export const MOCK_MEMBERS: Member[] = [
  {
    id: 'm1', fullName: 'Dr. Amina Yakubu', email: 'amina@who.int', isVerified: true,
    gender: 'FEMALE', yearGroup: 2005, programme: 'SCIENCE', house: 'VOLTA',
    occupation: 'Regional Health Advisor', organization: 'World Health Organization',
    city: 'Geneva', country: 'Switzerland', areaOfExpertise: ['Tropical Medicine', 'Public Health', 'Research'],
    isAvailableAsMentor: true, mentorBio: 'Passionate about guiding young scientists from Northern Ghana into global health careers.',
    membershipStatus: 'ACTIVE', isApproved: true, isWhatsAppMember: true,
    preferredContributions: [], consentGiven: true,
    createdAt: '2020-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'm2', fullName: 'Eng. Samuel Dagaare', email: 'samuel@dagaare.dev', isVerified: true,
    gender: 'MALE', yearGroup: 2008, programme: 'SCIENCE', house: 'NKRUMAH',
    occupation: 'Senior Software Engineer', organization: 'Google',
    city: 'Accra', country: 'Ghana', areaOfExpertise: ['Software Engineering', 'AI/ML', 'Cloud Computing'],
    isAvailableAsMentor: true, mentorBio: 'Happy to help alumni break into tech. I run free coding bootcamps in Wa every December.',
    membershipStatus: 'ACTIVE', isApproved: true, isWhatsAppMember: true,
    preferredContributions: [], consentGiven: true,
    createdAt: '2019-06-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'm3', fullName: 'Barr. Patience Naa', email: 'patience@lawfirm.gh', isVerified: true,
    gender: 'FEMALE', yearGroup: 2010, programme: 'GENERAL_ARTS', house: 'ACKAH',
    occupation: 'Lawyer', organization: 'Naa & Associates',
    city: 'Tamale', country: 'Ghana', areaOfExpertise: ['Corporate Law', 'Human Rights'],
    isAvailableAsMentor: true, mentorBio: 'Specializing in corporate law. Available to advise alumni on business legal matters.',
    membershipStatus: 'ACTIVE', isApproved: true, isWhatsAppMember: false,
    preferredContributions: [], consentGiven: true,
    createdAt: '2021-03-01T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'm4', fullName: 'Prof. Yakubu Nantomah', email: 'yakubu@uds.edu.gh', isVerified: true,
    gender: 'MALE', yearGroup: 1998, programme: 'SCIENCE', house: 'TANO',
    occupation: 'Professor of Mathematics', organization: 'University for Development Studies',
    city: 'Tamale', country: 'Ghana', areaOfExpertise: ['Mathematics', 'Research', 'Academic Writing'],
    isAvailableAsMentor: true, mentorBio: 'Over 20 years in academia. I mentor students pursuing postgraduate studies.',
    membershipStatus: 'ACTIVE', isApproved: true, isWhatsAppMember: true,
    preferredContributions: [], consentGiven: true,
    createdAt: '2018-01-01T00:00:00Z', updatedAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'm5', fullName: 'Madam Rukaya Ibrahim', email: 'rukaya@bank.gh', isVerified: true,
    gender: 'FEMALE', yearGroup: 2012, programme: 'BUSINESS', house: 'DENSU',
    occupation: 'Branch Manager', organization: 'GCB Bank',
    city: 'Wa', country: 'Ghana', areaOfExpertise: ['Banking', 'Finance', 'Microfinance'],
    isAvailableAsMentor: false, isWhatsAppMember: true,
    membershipStatus: 'ACTIVE', isApproved: true,
    preferredContributions: [], consentGiven: true,
    createdAt: '2022-05-01T00:00:00Z', updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'm6', fullName: 'Mr. Issah Wuni', email: 'issah@farm.gh', isVerified: true,
    gender: 'MALE', yearGroup: 2015, programme: 'SCIENCE', house: 'PRA',
    occupation: 'Agribusiness Owner', organization: 'Wuni Farms',
    city: 'Wa', country: 'Ghana', areaOfExpertise: ['Agriculture', 'Entrepreneurship'],
    isAvailableAsMentor: true, mentorBio: 'Started my farm with GHS 500. Now employing 15 people. I mentor aspiring agripreneurs.',
    membershipStatus: 'ACTIVE', isApproved: true, isWhatsAppMember: true,
    preferredContributions: [], consentGiven: true,
    createdAt: '2023-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
]
