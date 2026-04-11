import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ForumThread, ForumReply, ReplyStatus } from '../types'

const MOCK_THREADS: ForumThread[] = [
  {
    id: 'thread-1',
    title: 'Reconnecting after 20 years — any 2004 year group members here?',
    body: 'Hello everyone! I completed in 2004 (Padre Pio House) and I am trying to reconnect with old friends. Please drop a comment if you were in my year group. Would love to organise a small get-together in Kumasi.',
    authorName: 'Kwabena Ofori',
    authorEmail: 'kwabena.ofori@gmail.com',
    category: 'Alumni Stories',
    status: 'open',
    replyCount: 5,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-08T14:30:00.000Z',
  },
  {
    id: 'thread-2',
    title: 'Job opening at my firm — software engineers wanted',
    body: 'Hi all. My company, TechBridge Solutions, is actively hiring senior software engineers. We offer competitive salaries and remote-first work culture. DM me or visit our website for more details.',
    authorName: 'Emmanuel Kusi-Appiah',
    authorEmail: 'ekusi@techbridge.gh',
    category: 'Career',
    status: 'pinned',
    replyCount: 4,
    createdAt: '2026-02-20T09:00:00.000Z',
    updatedAt: '2026-03-05T11:00:00.000Z',
  },
  {
    id: 'thread-3',
    title: 'Feedback on the new UPOSA digital portal',
    body: 'I have been using the new portal for about two weeks now. Overall, it is a great improvement from the old website. A few suggestions: the event registration form crashes on mobile, and I would love to see a dark mode option.',
    authorName: 'Abena Asante',
    authorEmail: 'abena.asante@yahoo.com',
    category: 'Feedback',
    status: 'open',
    replyCount: 3,
    createdAt: '2026-02-28T15:00:00.000Z',
    updatedAt: '2026-03-02T09:00:00.000Z',
  },
  {
    id: 'thread-4',
    title: 'UPOSA Homecoming 2026 — date confirmed!',
    body: 'We are pleased to announce that the 2026 UPOSA Homecoming Weekend has been scheduled for August 14-16, 2026 at Opoku Ware School. Registration will open April 1. Mark your calendars!',
    authorName: 'UPOSA Secretariat',
    authorEmail: 'secretariat@uposa.org',
    category: 'Announcements',
    status: 'pinned',
    replyCount: 6,
    createdAt: '2026-03-05T08:00:00.000Z',
    updatedAt: '2026-03-05T08:00:00.000Z',
  },
  {
    id: 'thread-5',
    title: 'My journey from Opoku Ware to Silicon Valley',
    body: 'I wanted to share my story with the alumni community. After graduating in 1999, I pursued computer science at KNUST, later got a scholarship to MIT, and now I lead an engineering team at a major tech company in San Francisco. The foundation Opoku Ware gave me was invaluable.',
    authorName: 'Richard Amponsah',
    authorEmail: 'r.amponsah@gmail.com',
    category: 'Alumni Stories',
    status: 'open',
    replyCount: 5,
    createdAt: '2026-02-15T12:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'thread-6',
    title: 'Spam post — removed',
    body: 'This post violated community guidelines and has been removed by an administrator.',
    authorName: 'Unknown User',
    authorEmail: 'spam@example.com',
    category: 'General',
    status: 'deleted',
    replyCount: 0,
    createdAt: '2026-03-08T03:00:00.000Z',
    updatedAt: '2026-03-08T04:00:00.000Z',
  },
  {
    id: 'thread-7',
    title: 'Seeking advice: How to start a business in Ghana from abroad',
    body: 'I am based in the UK and want to start a logistics business in Ghana. Any alumni who have done this successfully? What are the key challenges and how did you navigate them? Looking for mentors.',
    authorName: 'Owusu Barimah',
    authorEmail: 'owusu.barimah@gmail.com',
    category: 'Career',
    status: 'open',
    replyCount: 4,
    createdAt: '2026-02-25T14:00:00.000Z',
    updatedAt: '2026-03-10T09:00:00.000Z',
  },
  {
    id: 'thread-8',
    title: 'Class of 1993 reunion planning — volunteers needed',
    body: 'Our year group is planning a 30th reunion celebration. We need volunteers to help with planning, venue booking, and reaching out to classmates. If you were Class of 1993, please get in touch.',
    authorName: 'Nana Osei',
    authorEmail: 'nana.osei@gmail.com',
    category: 'General',
    status: 'open',
    replyCount: 3,
    createdAt: '2026-03-02T08:00:00.000Z',
    updatedAt: '2026-03-09T16:00:00.000Z',
  },
  {
    id: 'thread-9',
    title: 'Congratulations to Opoku Ware — Regional Science Quiz Champions!',
    body: 'Our school has done it again! The current students won the Ashanti Regional Science and Maths Quiz. Let us rally behind them as they prepare for the nationals. UPOSA should consider funding their preparation.',
    authorName: 'Priscilla Donkor',
    authorEmail: 'priscilla.donkor@gmail.com',
    category: 'Announcements',
    status: 'open',
    replyCount: 4,
    createdAt: '2026-02-22T10:00:00.000Z',
    updatedAt: '2026-03-07T15:00:00.000Z',
  },
  {
    id: 'thread-10',
    title: 'Suggestion: UPOSA should start a mentorship programme',
    body: 'I think UPOSA should formalise a mentorship programme where working professionals are paired with current students. This could help guide students on career choices and provide real-world insights.',
    authorName: 'Adwoa Frimpong',
    authorEmail: 'adwoa.frimpong@gmail.com',
    category: 'Feedback',
    status: 'closed',
    replyCount: 3,
    createdAt: '2026-01-15T09:00:00.000Z',
    updatedAt: '2026-02-20T10:00:00.000Z',
  },
  {
    id: 'thread-11',
    title: 'Looking for UPOSA alumni in Berlin, Germany',
    body: 'I recently moved to Berlin for work and would love to connect with fellow Opoku Ware alumni in Germany. Are there any informal meetups or a Germany chapter being formed?',
    authorName: 'Gifty Mensah-Sarpong',
    authorEmail: 'gifty.sarpong@gmail.com',
    category: 'General',
    status: 'open',
    replyCount: 2,
    createdAt: '2026-03-10T11:00:00.000Z',
    updatedAt: '2026-03-13T14:00:00.000Z',
  },
  {
    id: 'thread-12',
    title: 'Financial literacy resources for young alumni',
    body: 'Following the excellent financial literacy webinar, I wanted to share some resources that have helped me with personal finance: budgeting apps, investment guides, and books. Check out the links below.',
    authorName: 'Benjamin Ofori-Atta',
    authorEmail: 'ben.oforiatta@gmail.com',
    category: 'Career',
    status: 'open',
    replyCount: 3,
    createdAt: '2026-03-04T16:00:00.000Z',
    updatedAt: '2026-03-12T10:00:00.000Z',
  },
  {
    id: 'thread-13',
    title: 'UPOSA dues payment — Mobile Money not working',
    body: 'I have been trying to pay my dues via MoMo but the shortcode is not working. Keeps showing "service unavailable". Has anyone else experienced this? Is there an alternative payment method?',
    authorName: 'Collins Badu',
    authorEmail: 'collins.badu@gmail.com',
    category: 'Feedback',
    status: 'open',
    replyCount: 4,
    createdAt: '2026-03-11T08:00:00.000Z',
    updatedAt: '2026-03-13T09:00:00.000Z',
  },
  {
    id: 'thread-14',
    title: 'Remembering Mr. Ackah — share your favourite memory',
    body: 'As we honour the late Mr. Joseph Ackah, I invite fellow alumni to share their favourite memories of our beloved headmaster. I remember how he would personally check on every dormitory before lights out. What a man.',
    authorName: 'Samuel Tetteh',
    authorEmail: 'samuel.tetteh@gmail.com',
    category: 'Alumni Stories',
    status: 'open',
    replyCount: 5,
    createdAt: '2026-01-05T09:00:00.000Z',
    updatedAt: '2026-02-28T16:00:00.000Z',
  },
  {
    id: 'thread-15',
    title: 'Nursing career opportunities in Ghana — advice needed',
    body: 'I am a nurse at Korle-Bu and considering specialising in paediatric nursing. Are there any alumni who have gone through specialisation programmes who can advise on the best path?',
    authorName: 'Akosua Boateng',
    authorEmail: 'akosua.boateng@gmail.com',
    category: 'Career',
    status: 'open',
    replyCount: 2,
    createdAt: '2026-03-07T10:00:00.000Z',
    updatedAt: '2026-03-11T14:00:00.000Z',
  },
  {
    id: 'thread-16',
    title: 'Photos from the 2024 Homecoming — link inside',
    body: 'I have uploaded all 150 photos from the 2024 Homecoming Weekend to Google Photos. Link: [redacted for privacy]. Feel free to download and share. Tag yourselves!',
    authorName: 'Fiifi Koomson',
    authorEmail: 'fiifi.koomson@gmail.com',
    category: 'General',
    status: 'open',
    replyCount: 3,
    createdAt: '2026-01-20T12:00:00.000Z',
    updatedAt: '2026-02-15T09:00:00.000Z',
  },
  {
    id: 'thread-17',
    title: 'Flood damage at school — how we can help',
    body: 'As you may have heard, the recent flooding damaged parts of the school. I am organising a volunteer cleanup crew for next Saturday. Who is in? Meet at the school gate at 7 AM.',
    authorName: 'Emmanuel Adjei-Mensah',
    authorEmail: 'emmanuel.adjei@gmail.com',
    category: 'Announcements',
    status: 'pinned',
    replyCount: 4,
    createdAt: '2026-03-04T07:00:00.000Z',
    updatedAt: '2026-03-08T10:00:00.000Z',
  },
  {
    id: 'thread-18',
    title: 'Best restaurants in Kumasi for alumni meetups?',
    body: 'The Kumasi Chapter is looking for a good venue for our monthly meetups. Somewhere with decent food, parking, and a private area for about 30-40 people. Any recommendations?',
    authorName: 'Millicent Amoako',
    authorEmail: 'millicent.amoako@gmail.com',
    category: 'General',
    status: 'open',
    replyCount: 3,
    createdAt: '2026-02-10T14:00:00.000Z',
    updatedAt: '2026-02-25T11:00:00.000Z',
  },
  {
    id: 'thread-19',
    title: 'Inappropriate content — flagged for review',
    body: 'This post has been flagged for containing inappropriate content and is under review by moderators.',
    authorName: 'Anonymous',
    authorEmail: 'flagged@example.com',
    category: 'General',
    status: 'deleted',
    replyCount: 2,
    createdAt: '2026-03-12T22:00:00.000Z',
    updatedAt: '2026-03-13T06:00:00.000Z',
  },
  {
    id: 'thread-20',
    title: 'Election 2025-2027: Who are you voting for?',
    body: 'The nominations for the 2025-2027 executive elections are in. Let us discuss the candidates and their manifestos. Remember to vote during the election period (April 1-7). Every vote counts!',
    authorName: 'Daniel Asamoah',
    authorEmail: 'daniel.asamoah@gmail.com',
    category: 'General',
    status: 'open',
    replyCount: 5,
    createdAt: '2026-03-09T08:00:00.000Z',
    updatedAt: '2026-03-14T10:00:00.000Z',
  },
]

const MOCK_REPLIES: ForumReply[] = [
  // thread-1 replies
  { id: 'reply-1-1', threadId: 'thread-1', authorName: 'Kofi Mensah', authorEmail: 'kofi.mensah@gmail.com', body: 'Hey Kwabena! I was in Padre Pio too, Class of 2004. I remember you! Let\'s definitely link up. I\'m in Kumasi most weekends.', status: 'active', createdAt: '2026-03-01T14:00:00.000Z' },
  { id: 'reply-1-2', threadId: 'thread-1', authorName: 'Akua Serwaa', authorEmail: 'akua.serwaa@gmail.com', body: 'Not 2004 but 2005 here. Would love to join the get-together if it\'s open to neighbouring year groups!', status: 'active', createdAt: '2026-03-02T09:30:00.000Z' },
  { id: 'reply-1-3', threadId: 'thread-1', authorName: 'Yaw Boakye', authorEmail: 'yaw.boakye@gmail.com', body: 'Class of 2004 represeeent! Who else remembers Mr. Osei\'s chemistry practicals? Those were wild times.', status: 'active', createdAt: '2026-03-03T11:00:00.000Z' },
  { id: 'reply-1-4', threadId: 'thread-1', authorName: 'Spam Bot', authorEmail: 'spam@fake.com', body: 'Buy cheap watches at www.scam-link.com!!! Best deals!!!', status: 'flagged', createdAt: '2026-03-04T02:00:00.000Z' },
  { id: 'reply-1-5', threadId: 'thread-1', authorName: 'Ama Darko', authorEmail: 'ama.darko@gmail.com', body: 'Count me in! I\'ll help organise if we settle on a date. My number is in the alumni directory.', status: 'active', createdAt: '2026-03-05T16:00:00.000Z' },

  // thread-2 replies
  { id: 'reply-2-1', threadId: 'thread-2', authorName: 'Kwesi Appiah', authorEmail: 'kwesi.appiah@gmail.com', body: 'This is great, Emmanuel! What tech stack are you using? I have 5 years of experience with React and Node.js.', status: 'active', createdAt: '2026-02-21T10:00:00.000Z' },
  { id: 'reply-2-2', threadId: 'thread-2', authorName: 'Priscilla Owusu', authorEmail: 'priscilla.owusu@gmail.com', body: 'Do you accept junior developers? I just graduated from KNUST with a CS degree and I\'m looking for my first role.', status: 'active', createdAt: '2026-02-22T08:30:00.000Z' },
  { id: 'reply-2-3', threadId: 'thread-2', authorName: 'Offensive User', authorEmail: 'troll@example.com', body: 'This company is terrible, they never pay on time. DO NOT apply here!!! Total waste of time.', status: 'hidden', createdAt: '2026-02-23T15:00:00.000Z' },
  { id: 'reply-2-4', threadId: 'thread-2', authorName: 'Daniel Nkrumah', authorEmail: 'daniel.nkrumah@gmail.com', body: 'Applied! Sent my CV to your email. Hope to hear back soon. Thanks for sharing with the alumni community.', status: 'active', createdAt: '2026-02-25T09:00:00.000Z' },

  // thread-3 replies
  { id: 'reply-3-1', threadId: 'thread-3', authorName: 'Admin - Secretariat', authorEmail: 'admin@uposa.org', body: 'Thank you for the feedback, Abena! We\'ve logged the mobile issue and our developers are working on it. Dark mode is on the roadmap for Q2.', status: 'active', createdAt: '2026-02-28T18:00:00.000Z' },
  { id: 'reply-3-2', threadId: 'thread-3', authorName: 'Kofi Asante', authorEmail: 'kofi.asante@gmail.com', body: 'I second the dark mode request. Also, can we get push notifications for events?', status: 'active', createdAt: '2026-03-01T08:00:00.000Z' },
  { id: 'reply-3-3', threadId: 'thread-3', authorName: 'Esi Tawiah', authorEmail: 'esi.tawiah@gmail.com', body: 'The event calendar is really nice though. Much better than the old Google Sheets approach we had before!', status: 'active', createdAt: '2026-03-01T14:00:00.000Z' },

  // thread-4 replies
  { id: 'reply-4-1', threadId: 'thread-4', authorName: 'Nana Agyemang', authorEmail: 'nana.agyemang@gmail.com', body: 'Finally! I\'ve been waiting for this. Already booked my flights from London. Can\'t wait to see the old campus.', status: 'active', createdAt: '2026-03-05T10:00:00.000Z' },
  { id: 'reply-4-2', threadId: 'thread-4', authorName: 'Afia Poku', authorEmail: 'afia.poku@gmail.com', body: 'Will there be accommodation at the school or should we arrange our own? Last time the dorms were available for alumni.', status: 'active', createdAt: '2026-03-05T12:00:00.000Z' },
  { id: 'reply-4-3', threadId: 'thread-4', authorName: 'UPOSA Secretariat', authorEmail: 'secretariat@uposa.org', body: 'Accommodation info will be shared in April. We are working with the school administration to make dorms available again.', status: 'active', createdAt: '2026-03-05T15:00:00.000Z' },
  { id: 'reply-4-4', threadId: 'thread-4', authorName: 'Kwame Asiedu', authorEmail: 'kwame.asiedu@gmail.com', body: 'Our 1998 year group will be there 30 strong! Already started a WhatsApp group for planning.', status: 'active', createdAt: '2026-03-06T09:00:00.000Z' },
  { id: 'reply-4-5', threadId: 'thread-4', authorName: 'Spam Account', authorEmail: 'crypto@scam.com', body: 'Invest in crypto and earn 500% returns!!! Click here: bit.ly/scamlink', status: 'flagged', createdAt: '2026-03-06T03:00:00.000Z' },
  { id: 'reply-4-6', threadId: 'thread-4', authorName: 'Joseph Owusu', authorEmail: 'joseph.owusu@gmail.com', body: 'I\'ll volunteer to help with logistics. I work at a hotel in Kumasi and can negotiate group rates for alumni.', status: 'active', createdAt: '2026-03-07T11:00:00.000Z' },

  // thread-5 replies
  { id: 'reply-5-1', threadId: 'thread-5', authorName: 'Grace Amoah', authorEmail: 'grace.amoah@gmail.com', body: 'What an inspiring journey, Richard! You should come give a talk during the homecoming. The current students would benefit immensely.', status: 'active', createdAt: '2026-02-16T08:00:00.000Z' },
  { id: 'reply-5-2', threadId: 'thread-5', authorName: 'Peter Adjei', authorEmail: 'peter.adjei@gmail.com', body: 'I remember you from the Computer Club! You were always tinkering with things. Not surprised you ended up in Silicon Valley.', status: 'active', createdAt: '2026-02-17T14:00:00.000Z' },
  { id: 'reply-5-3', threadId: 'thread-5', authorName: 'Nana Yaa Mensah', authorEmail: 'nanayaa@gmail.com', body: 'This gives me so much hope. I\'m currently applying for scholarships abroad. Any advice on the application process?', status: 'active', createdAt: '2026-02-18T10:00:00.000Z' },
  { id: 'reply-5-4', threadId: 'thread-5', authorName: 'Jealous Person', authorEmail: 'hater@example.com', body: 'Stop showing off. Not everyone had the privilege of rich parents to fund their education abroad.', status: 'hidden', createdAt: '2026-02-19T22:00:00.000Z' },
  { id: 'reply-5-5', threadId: 'thread-5', authorName: 'Richard Amponsah', authorEmail: 'r.amponsah@gmail.com', body: 'Thank you all for the kind words! @NanaYaa — DM me, happy to review your scholarship applications and give tips.', status: 'active', createdAt: '2026-02-20T09:00:00.000Z' },

  // thread-7 replies
  { id: 'reply-7-1', threadId: 'thread-7', authorName: 'Frank Boateng', authorEmail: 'frank.boateng@gmail.com', body: 'I started a logistics company from the UK 3 years ago. Happy to chat. The key is having a reliable local partner. DM me.', status: 'active', createdAt: '2026-02-26T10:00:00.000Z' },
  { id: 'reply-7-2', threadId: 'thread-7', authorName: 'Ama Sarpong', authorEmail: 'ama.sarpong@gmail.com', body: 'Business registration can be done via the Registrar General\'s Department online portal now. Much easier than before.', status: 'active', createdAt: '2026-02-27T08:00:00.000Z' },
  { id: 'reply-7-3', threadId: 'thread-7', authorName: 'Michael Tetteh', authorEmail: 'michael.tetteh@gmail.com', body: 'The biggest challenge is finding trustworthy staff. I\'d recommend starting small and scaling gradually. Also, tax registration with GRA is critical.', status: 'active', createdAt: '2026-02-28T14:00:00.000Z' },
  { id: 'reply-7-4', threadId: 'thread-7', authorName: 'Owusu Barimah', authorEmail: 'owusu.barimah@gmail.com', body: 'Thanks everyone for the amazing advice! Frank, I\'ve sent you a DM. This community is incredible.', status: 'active', createdAt: '2026-03-01T09:00:00.000Z' },

  // thread-8 replies
  { id: 'reply-8-1', threadId: 'thread-8', authorName: 'Isaac Mensah', authorEmail: 'isaac.mensah@gmail.com', body: 'Class of 93 here! Count me in for the planning committee. Let\'s make this one memorable.', status: 'active', createdAt: '2026-03-03T09:00:00.000Z' },
  { id: 'reply-8-2', threadId: 'thread-8', authorName: 'Abigail Oppong', authorEmail: 'abigail.oppong@gmail.com', body: 'I can help with social media outreach. We have a Facebook group with about 200 members from our year.', status: 'active', createdAt: '2026-03-04T11:00:00.000Z' },
  { id: 'reply-8-3', threadId: 'thread-8', authorName: 'Charles Adu', authorEmail: 'charles.adu@gmail.com', body: 'Suggest we book Golden Tulip in Kumasi. They gave us a good rate for the 25th reunion.', status: 'active', createdAt: '2026-03-05T14:00:00.000Z' },

  // thread-9 replies
  { id: 'reply-9-1', threadId: 'thread-9', authorName: 'Prof. Kwaku Mensah', authorEmail: 'prof.mensah@knust.edu.gh', body: 'Proud moment for the school! I volunteer to help coach them for the nationals. I teach physics at KNUST.', status: 'active', createdAt: '2026-02-23T10:00:00.000Z' },
  { id: 'reply-9-2', threadId: 'thread-9', authorName: 'UPOSA Secretariat', authorEmail: 'secretariat@uposa.org', body: 'We have allocated GHS 5,000 from the alumni fund to support their preparation. More details coming soon.', status: 'active', createdAt: '2026-02-24T08:00:00.000Z' },
  { id: 'reply-9-3', threadId: 'thread-9', authorName: 'Sandra Antwi', authorEmail: 'sandra.antwi@gmail.com', body: 'Fantastic news! Opoku Ware never disappoints. Wishing them all the best at the nationals! 🏆', status: 'active', createdAt: '2026-02-25T12:00:00.000Z' },
  { id: 'reply-9-4', threadId: 'thread-9', authorName: 'Rude Commenter', authorEmail: 'troll2@example.com', body: 'Who cares about quiz competitions? Focus on real issues like the broken dormitories.', status: 'flagged', createdAt: '2026-02-26T22:00:00.000Z' },

  // thread-10 replies
  { id: 'reply-10-1', threadId: 'thread-10', authorName: 'Dr. Ama Badu', authorEmail: 'dr.badu@gmail.com', body: 'Excellent idea! I\'d be happy to mentor students in medicine and public health. How do we sign up?', status: 'active', createdAt: '2026-01-16T09:00:00.000Z' },
  { id: 'reply-10-2', threadId: 'thread-10', authorName: 'UPOSA Secretariat', authorEmail: 'secretariat@uposa.org', body: 'We love this suggestion! The executive committee will discuss at the next meeting and share a formal proposal.', status: 'active', createdAt: '2026-01-18T10:00:00.000Z' },
  { id: 'reply-10-3', threadId: 'thread-10', authorName: 'Kwadwo Ansah', authorEmail: 'kwadwo.ansah@gmail.com', body: 'Some universities do this well. We could model it after the KNUST alumni mentorship scheme.', status: 'active', createdAt: '2026-01-20T14:00:00.000Z' },

  // thread-11 replies
  { id: 'reply-11-1', threadId: 'thread-11', authorName: 'Eric Ofosu', authorEmail: 'eric.ofosu@gmail.com', body: 'Hi Gifty! I\'m in Munich. There are about 5-6 of us in Germany. Let me add you to our WhatsApp group.', status: 'active', createdAt: '2026-03-11T08:00:00.000Z' },
  { id: 'reply-11-2', threadId: 'thread-11', authorName: 'Diana Adjei', authorEmail: 'diana.adjei@gmail.com', body: 'I\'m in Frankfurt! Would love to meet up. We should plan a Germany chapter launch dinner.', status: 'active', createdAt: '2026-03-12T14:00:00.000Z' },

  // thread-12 replies
  { id: 'reply-12-1', threadId: 'thread-12', authorName: 'Joyce Opoku', authorEmail: 'joyce.opoku@gmail.com', body: 'Thanks for sharing! The budgeting app recommendation was exactly what I needed.', status: 'active', createdAt: '2026-03-05T10:00:00.000Z' },
  { id: 'reply-12-2', threadId: 'thread-12', authorName: 'Scammer', authorEmail: 'scam@example.com', body: 'I can double your money in 24 hours. Send GHS 1,000 to my MoMo number: 0XX-XXX-XXXX', status: 'flagged', createdAt: '2026-03-06T03:00:00.000Z' },
  { id: 'reply-12-3', threadId: 'thread-12', authorName: 'Emmanuel Mensah', authorEmail: 'emmanuel.mensah@gmail.com', body: 'Great resources! I would add "The Richest Man in Babylon" to the book list. Classic personal finance read.', status: 'active', createdAt: '2026-03-07T09:00:00.000Z' },

  // thread-13 replies
  { id: 'reply-13-1', threadId: 'thread-13', authorName: 'UPOSA Finance', authorEmail: 'finance@uposa.org', body: 'We are aware of the MoMo issue. Our payment provider had a service outage. Please try again or use the bank transfer option (details on the portal).', status: 'active', createdAt: '2026-03-11T10:00:00.000Z' },
  { id: 'reply-13-2', threadId: 'thread-13', authorName: 'Yaa Asantewaa', authorEmail: 'yaa.asantewaa@gmail.com', body: 'Same issue here! I tried three times yesterday. Bank transfer worked though.', status: 'active', createdAt: '2026-03-11T14:00:00.000Z' },
  { id: 'reply-13-3', threadId: 'thread-13', authorName: 'Collins Badu', authorEmail: 'collins.badu@gmail.com', body: 'Thanks for the update. Used bank transfer and it went through. Maybe add more payment options like card payment?', status: 'active', createdAt: '2026-03-12T08:00:00.000Z' },
  { id: 'reply-13-4', threadId: 'thread-13', authorName: 'UPOSA Finance', authorEmail: 'finance@uposa.org', body: 'MoMo service is now restored. Card payment integration is in progress and should be live by end of March.', status: 'active', createdAt: '2026-03-13T09:00:00.000Z' },

  // thread-14 replies
  { id: 'reply-14-1', threadId: 'thread-14', authorName: 'Elizabeth Mensah', authorEmail: 'elizabeth.mensah@gmail.com', body: 'Mr. Ackah always had a kind word for everyone. He encouraged me to pursue engineering when nobody else believed in me. Rest in peace, sir.', status: 'active', createdAt: '2026-01-06T08:00:00.000Z' },
  { id: 'reply-14-2', threadId: 'thread-14', authorName: 'James Owusu', authorEmail: 'james.owusu@gmail.com', body: 'I remember his famous phrase: "Discipline today, success tomorrow." Changed my life. What a legend.', status: 'active', createdAt: '2026-01-07T10:00:00.000Z' },
  { id: 'reply-14-3', threadId: 'thread-14', authorName: 'Comfort Addo', authorEmail: 'comfort.addo@gmail.com', body: 'He personally paid my school fees for two terms when my family couldn\'t afford it. I owe my education to him. 🕊️', status: 'active', createdAt: '2026-01-08T14:00:00.000Z' },
  { id: 'reply-14-4', threadId: 'thread-14', authorName: 'Disrespectful User', authorEmail: 'troll3@example.com', body: 'Can we stop idolising everyone who dies? He was just doing his job.', status: 'hidden', createdAt: '2026-01-09T22:00:00.000Z' },
  { id: 'reply-14-5', threadId: 'thread-14', authorName: 'Samuel Tetteh', authorEmail: 'samuel.tetteh@gmail.com', body: 'Thank you all for sharing. I\'m compiling these memories into a tribute booklet. If you have photos, please email them to me.', status: 'active', createdAt: '2026-01-10T09:00:00.000Z' },

  // thread-15 replies
  { id: 'reply-15-1', threadId: 'thread-15', authorName: 'Dr. Patience Nyarko', authorEmail: 'dr.nyarko@gmail.com', body: 'I specialised in paediatric nursing at 37 Military Hospital. Happy to chat about the pathway. It\'s a rewarding field!', status: 'active', createdAt: '2026-03-08T10:00:00.000Z' },
  { id: 'reply-15-2', threadId: 'thread-15', authorName: 'Akosua Boateng', authorEmail: 'akosua.boateng@gmail.com', body: 'Thank you Dr. Nyarko! I\'ll send you an email. It\'s great to have alumni in the medical field to guide us.', status: 'active', createdAt: '2026-03-09T08:00:00.000Z' },

  // thread-16 replies
  { id: 'reply-16-1', threadId: 'thread-16', authorName: 'Rebecca Asante', authorEmail: 'rebecca.asante@gmail.com', body: 'Amazing photos! Found myself in three of them 😂. Those were good times.', status: 'active', createdAt: '2026-01-21T09:00:00.000Z' },
  { id: 'reply-16-2', threadId: 'thread-16', authorName: 'Philip Mensah', authorEmail: 'philip.mensah@gmail.com', body: 'The group photo at the chapel brought back so many memories. Thank you for documenting this, Fiifi!', status: 'active', createdAt: '2026-01-22T14:00:00.000Z' },
  { id: 'reply-16-3', threadId: 'thread-16', authorName: 'Fiifi Koomson', authorEmail: 'fiifi.koomson@gmail.com', body: 'Glad you all enjoyed them! I\'ll make sure to cover the 2026 Homecoming too.', status: 'active', createdAt: '2026-01-23T10:00:00.000Z' },

  // thread-17 replies
  { id: 'reply-17-1', threadId: 'thread-17', authorName: 'Kwabena Opoku', authorEmail: 'kwabena.opoku@gmail.com', body: 'I\'m in! Will bring some tools and supplies. Has the school assessed the full extent of the damage?', status: 'active', createdAt: '2026-03-04T10:00:00.000Z' },
  { id: 'reply-17-2', threadId: 'thread-17', authorName: 'Agnes Fosu', authorEmail: 'agnes.fosu@gmail.com', body: 'My company can donate roofing materials. Please share details of what\'s needed.', status: 'active', createdAt: '2026-03-05T08:00:00.000Z' },
  { id: 'reply-17-3', threadId: 'thread-17', authorName: 'Emmanuel Adjei-Mensah', authorEmail: 'emmanuel.adjei@gmail.com', body: 'Update: The science lab and two dormitory blocks were most affected. We need volunteers, building materials, and cash donations. Contact me directly.', status: 'active', createdAt: '2026-03-06T09:00:00.000Z' },
  { id: 'reply-17-4', threadId: 'thread-17', authorName: 'UPOSA Secretariat', authorEmail: 'secretariat@uposa.org', body: 'UPOSA has set up an emergency fund for the flood repairs. Donate via the portal under "Flood Relief Fund". Target: GHS 50,000.', status: 'active', createdAt: '2026-03-07T10:00:00.000Z' },

  // thread-18 replies
  { id: 'reply-18-1', threadId: 'thread-18', authorName: 'Ernest Adjei', authorEmail: 'ernest.adjei@gmail.com', body: 'Try Asafo Kitchen near Kejetia. Good food, spacious, and they have a private section upstairs.', status: 'active', createdAt: '2026-02-11T09:00:00.000Z' },
  { id: 'reply-18-2', threadId: 'thread-18', authorName: 'Mary Owusu', authorEmail: 'mary.owusu@gmail.com', body: 'Golden Tulip\'s buffet restaurant is also great for groups. They can accommodate up to 50 people.', status: 'active', createdAt: '2026-02-12T14:00:00.000Z' },
  { id: 'reply-18-3', threadId: 'thread-18', authorName: 'Millicent Amoako', authorEmail: 'millicent.amoako@gmail.com', body: 'Thanks for the suggestions! Will check out both and report back to the chapter.', status: 'active', createdAt: '2026-02-13T10:00:00.000Z' },

  // thread-20 replies
  { id: 'reply-20-1', threadId: 'thread-20', authorName: 'Akwasi Boateng', authorEmail: 'akwasi.boateng@gmail.com', body: 'I\'m voting for Nana Agyemang for president. His manifesto on scholarship expansion is exactly what we need.', status: 'active', createdAt: '2026-03-09T12:00:00.000Z' },
  { id: 'reply-20-2', threadId: 'thread-20', authorName: 'Abena Mensah', authorEmail: 'abena.mensah@gmail.com', body: 'Dr. Owusu-Frimpong has my vote. Her track record with the women\'s chapter initiative was impressive.', status: 'active', createdAt: '2026-03-10T08:00:00.000Z' },
  { id: 'reply-20-3', threadId: 'thread-20', authorName: 'Disruptive User', authorEmail: 'disrupt@example.com', body: 'All candidates are useless. UPOSA is a waste of time. The executives just pocket our dues.', status: 'flagged', createdAt: '2026-03-11T01:00:00.000Z' },
  { id: 'reply-20-4', threadId: 'thread-20', authorName: 'Daniel Asamoah', authorEmail: 'daniel.asamoah@gmail.com', body: 'Let\'s keep this discussion respectful. All candidates have presented their manifestos — read them before deciding. Link is on the elections page.', status: 'active', createdAt: '2026-03-11T09:00:00.000Z' },
  { id: 'reply-20-5', threadId: 'thread-20', authorName: 'Comfort Agyei', authorEmail: 'comfort.agyei@gmail.com', body: 'Can we have a virtual debate or Q&A session with the candidates before voting opens? That would help undecided voters like me.', status: 'active', createdAt: '2026-03-12T14:00:00.000Z' },
]

interface ForumState {
  threads: ForumThread[]
  replies: ForumReply[]
  updateThread: (id: string, updates: Partial<ForumThread>) => void
  deleteThread: (id: string) => void
  addReply: (reply: Omit<ForumReply, 'id' | 'createdAt'>) => ForumReply
  updateReplyStatus: (replyId: string, status: ReplyStatus) => void
  deleteReply: (replyId: string) => void
  getRepliesForThread: (threadId: string) => ForumReply[]
  resetToDefaults: () => void
}

export const useForumStore = create<ForumState>()(
  persist(
    (set, get) => ({
      threads: MOCK_THREADS,
      replies: MOCK_REPLIES,
      updateThread: (id, updates) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        })),
      deleteThread: (id) =>
        set((s) => ({
          threads: s.threads.map((t) =>
            t.id === id
              ? { ...t, status: 'deleted' as const, updatedAt: new Date().toISOString() }
              : t
          ),
        })),
      addReply: (reply) => {
        const newReply: ForumReply = {
          ...reply,
          id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({
          replies: [...s.replies, newReply],
          threads: s.threads.map((t) =>
            t.id === reply.threadId
              ? { ...t, replyCount: t.replyCount + 1, updatedAt: new Date().toISOString() }
              : t
          ),
        }))
        return newReply
      },
      updateReplyStatus: (replyId, status) =>
        set((s) => ({
          replies: s.replies.map((r) =>
            r.id === replyId ? { ...r, status } : r
          ),
        })),
      deleteReply: (replyId) => {
        const reply = get().replies.find((r) => r.id === replyId)
        if (!reply) return
        set((s) => ({
          replies: s.replies.filter((r) => r.id !== replyId),
          threads: s.threads.map((t) =>
            t.id === reply.threadId
              ? { ...t, replyCount: Math.max(0, t.replyCount - 1) }
              : t
          ),
        }))
      },
      getRepliesForThread: (threadId) => {
        return get().replies.filter((r) => r.threadId === threadId)
      },
      resetToDefaults: () => set({ threads: MOCK_THREADS, replies: MOCK_REPLIES }),
    }),
    { name: 'uposa_forum', version: 2 }
  )
)
