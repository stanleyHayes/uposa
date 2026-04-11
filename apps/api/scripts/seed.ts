import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1);
}

const client = new MongoClient(DATABASE_URL);

async function main() {
  await client.connect();
  const db = client.db();
  const now = new Date();

  // Seed executives
  console.log('Seeding executives...');
  await db.collection('executives').deleteMany({});

  const executives = [
    { name: 'Emmanuel Paul Owusu', position: 'President', classOf: 'Class of 1983', order: 1, isActive: true },
    { name: 'Nana Akosua Gyamfiaba II', position: 'Vice President', classOf: 'Class of 1981', order: 2, isActive: true },
    { name: 'Efua Sekyiwa Assan', position: 'Secretary', classOf: 'Class of 2000', order: 3, isActive: true },
    { name: 'Geoffrey Nanah', position: 'Assistant Secretary', classOf: 'Class of 2012', order: 4, isActive: true },
    { name: 'Dr. Samuel Jabez Arkaifie', position: 'Organiser', classOf: 'Class of 2004', order: 5, isActive: true },
    { name: 'Francis Dawson', position: 'Assistant Organiser', classOf: 'Class of 2005', order: 6, isActive: true },
    { name: 'Derrick Ofori Kwafo', position: 'Coordinator', classOf: 'Class of 2002', order: 7, isActive: true },
    { name: 'Robert Ofori Abosompim', position: 'Treasurer', classOf: 'Class of 2000', order: 8, isActive: true },
    { name: 'Alfred Atom Prah', position: 'Executive Member', classOf: 'Class of 1996', order: 9, isActive: true },
    { name: 'Kwamena Duncan Dennis', position: 'Ex-Officio Member', classOf: '', order: 10, isActive: true },
  ].map(e => ({ ...e, photoUrl: null, createdAt: now, updatedAt: now }));

  await db.collection('executives').insertMany(executives);
  console.log(`Seeded ${executives.length} executives.`);

  // Seed site configs
  console.log('Seeding site configs...');
  const configs = [
    {
      key: 'contact',
      value: {
        phones: ['0244036676', '0246446333'],
        emails: { general: 'info@uposa.org', secretary: 'secretary@uposa.org', membership: 'membership@uposa.org', events: 'events@uposa.org' },
        address: 'University Practice Senior High School, UCC, Cape Coast',
        officeHours: 'Monday-Friday 9AM-5PM, Saturday 10AM-2PM',
      },
    },
    {
      key: 'social',
      value: {
        facebook: 'https://www.facebook.com/share/1Ckq3GEdMS/',
        instagram: 'https://www.instagram.com/uposanational?igsh=MTJieWxjN3dnYXh6',
        whatsapp: 'https://whatsapp.com/channel/0029VaCKEgS9MF99NcAnVl47',
      },
    },
    {
      key: 'payment',
      value: {
        momo: { number: '0598987137', payId: '159025', accountName: 'UPOSA National' },
        bank: { bank: 'GCB Bank', accountNo: '3021440000835', accountName: 'UPOSA PROJECT ACCOUNT', branch: 'UCC Branch' },
      },
    },
    { key: 'dues', value: { annual: 120, lifetime: 1000, currency: 'GHS' } },
    {
      key: 'donationAllocation',
      value: [
        { title: 'Infrastructure', description: 'School buildings, labs, and facilities', percentage: 60 },
        { title: 'Learning Resources', description: 'Books, equipment, and supplies', percentage: 25 },
        { title: 'Welfare & Events', description: 'Student welfare and community events', percentage: 10 },
        { title: 'NSMQ Team', description: 'Supporting the National Science & Maths Quiz team', percentage: 5 },
      ],
    },
    {
      key: 'mission',
      value: {
        mission: 'To foster a strong network of University Practice Senior High School alumni, dedicated to supporting the development of our alma mater, empowering members through professional growth opportunities, and contributing positively to the communities we serve.',
        vision: 'To be the most vibrant and impactful alumni association in Ghana, recognized for our unwavering commitment to educational excellence, member welfare, and sustainable development of University Practice Senior High School.',
      },
    },
    {
      key: 'history',
      value: {
        paragraphs: [
          'The University Practice Old Students Association (UPOSA) was established to bring together all alumni of University Practice Senior High School (formerly University Practice Secondary School). The association was born out of the need for old students to give back to their alma mater and to create a platform for networking and mutual support.',
          'Over the years, UPOSA has grown from a small group of dedicated alumni to a thriving international association with chapters across Ghana and abroad. The association has been instrumental in numerous projects that have transformed the school.',
          'Today, UPOSA continues to be a beacon of hope for current students and a source of pride for alumni, upholding the school motto and traditions that have defined generations of graduates.',
        ],
      },
    },
    { key: 'stats', value: { members: 5000, years: 50, projects: 20, events: 100 } },
    {
      key: 'schoolInfo',
      value: {
        name: 'University Practice Senior High School',
        abbreviation: 'UPSHS',
        founded: 1974,
        location: 'Cape Coast, Ghana',
        slogan: 'The Legit Elites',
        studentPopulation: 1500,
        teachingStaff: 80,
        programs: [
          { name: 'General Science', description: 'Physics, Chemistry, Biology, Elective Maths' },
          { name: 'General Arts', description: 'Literature, Government, History, Economics' },
          { name: 'Business', description: 'Accounting, Business Management, Economics, Costing' },
          { name: 'Visual Arts', description: 'Graphic Design, Textiles, Sculpture, Ceramics' },
        ],
        leadership: [
          { name: 'Mr. Isaac Appiah', position: 'Headmaster', initials: 'IA' },
          { name: 'Mrs. Grace Mensah', position: 'Assistant Headmistress (Academic)', initials: 'GM' },
          { name: 'Mr. Daniel Quaye', position: 'Assistant Headmaster (Admin)', initials: 'DQ' },
          { name: 'Mrs. Felicia Owusu', position: 'Senior Housemaster', initials: 'FO' },
        ],
        achievements: [
          { year: '2025', description: 'Reached NSMQ National Semi-Finals' },
          { year: '2024', description: 'Best Science School Award, Central Region' },
          { year: '2023', description: 'Won Regional Debate Championship' },
          { year: '2022', description: 'Commissioned new ICT Laboratory' },
          { year: '2021', description: 'Achieved 95% WASSCE pass rate' },
          { year: '2020', description: 'Launched STEM Excellence Programme' },
        ],
        notableAlumni: [
          { name: 'Prof. Akua Sarpong', achievement: 'Leading Researcher in Renewable Energy', yearGroup: 'Class of 1995' },
          { name: 'Dr. Ama Mensah', achievement: 'Chief Medical Officer, Ridge Hospital', yearGroup: 'Class of 2005' },
          { name: 'Hon. Kofi Adjei', achievement: 'Member of Parliament, Cape Coast North', yearGroup: 'Class of 1998' },
          { name: 'Ing. Yaw Boateng', achievement: 'CEO, TechStart Ghana', yearGroup: 'Class of 2003' },
          { name: 'Mrs. Efua Mensah', achievement: 'Award-winning Journalist, GBC', yearGroup: 'Class of 2007' },
          { name: 'Dr. Kwesi Aidoo', achievement: 'Professor of Mathematics, UCC', yearGroup: 'Class of 2000' },
        ],
      },
    },
  ];

  for (const config of configs) {
    await db.collection('site_config').updateOne(
      { key: config.key },
      { $set: { key: config.key, value: config.value, updatedAt: now } },
      { upsert: true },
    );
  }
  console.log(`Seeded ${configs.length} site configs.`);

  // Seed year group reps
  console.log('Seeding year group reps...');
  await db.collection('year_group_reps').deleteMany({});
  const reps = [
    { year: '1981', name: 'Coleman William Gyedu', contact: '0243635998', order: 1 },
    { year: '1981', name: 'Nana Kwow E Richardson', contact: '0244374722', order: 2 },
    { year: '1982', name: 'Jonathan Nortey', contact: '+44 7480 762084', email: 'jnortey9@gmail.com', order: 1 },
    { year: '1982', name: 'Nana Akosua Gyamfiaba', contact: '0547582293', email: 'akosuagyamfiaba@yahoo.com', order: 2 },
    { year: '1983', name: 'Victor Yankey', contact: '0207066235', order: 1 },
    { year: '1983', name: 'Florence Ghapson', contact: '0244624715', order: 2 },
    { year: '1984', name: 'Nkana Appiah Kum', contact: '+774 777 8806', order: 1 },
    { year: '1984', name: 'Sophia Blankson', contact: '0242684947', order: 2 },
    { year: '1985', name: 'Joseph Kwesi Biney', contact: '0576044203', email: 'josephbiney42@gmail.com', order: 1 },
    { year: '1986', name: 'Stephen Aidoo', contact: '0546005900', order: 1 },
    { year: '1986', name: 'Vida Acquah', contact: '0243427783', order: 2 },
    { year: '1987', name: 'John Sammah', contact: '0244372022', order: 1 },
    { year: '1987', name: 'Joanna Martha Holdbrook', contact: '0243381581', email: 'joannaholdbrook@gmail.com', order: 2 },
    { year: '1989', name: 'Isaiah Boafo', contact: '0244602867', email: 'isaiahboafo@gmail.com', order: 1 },
    { year: '1989', name: 'Rosemary Mensah', contact: '0206851405', email: 'rosemary.sekyiamah@ucc.edu.gh', order: 2 },
    { year: '1991', name: 'Dr. Agartha Ohemeng', contact: '0244862606', email: 'anohemeng@gmail.com', order: 1 },
    { year: '1992', name: 'John Minnow', contact: '0541054129', email: 'johnminnow54gmail.com', order: 1 },
    { year: '1992', name: 'Isaac Kwesi Appiah', contact: '0243469535', email: 'isaackwesiappiah2@gmail.com', order: 2 },
    { year: '1993', name: 'Dr. Samuel Amoako', contact: '0244695329', email: 'kwabenaamoako1@gmail.com', order: 1 },
    { year: '1993', name: 'Bernard Blay Mensah', contact: '0246222396', order: 2 },
    { year: '1995', name: 'Shirley Dawson', contact: '0503934521', order: 1 },
    { year: '1996', name: 'Nicholas Oduro Baah', contact: '0540125071', order: 1 },
    { year: '1996', name: 'Yvonne Barnieh', contact: '0204968649', email: 'yvonnebarnieh@gmail.com', order: 2 },
    { year: '1997', name: 'Prince Charles', contact: '0277556023', order: 1 },
    { year: '1997', name: 'Faustina Sagoe', contact: '0244827551', order: 2 },
    { year: '1998', name: 'Ebenezer Konstantine Anku', contact: '0245947709', email: 'ankukonstatine@gmail.com', order: 1 },
    { year: '1998', name: 'Edith Forson', contact: '0546129354', email: 'gyaabaforson@gmail.com', order: 2 },
    { year: '1999', name: 'Anthony Kwesi Botchway', contact: '0243214546', email: 'kwesi.botchway@yahoo.com', order: 1 },
    { year: '2000', name: 'Oteng Nketia', contact: '0246443056', email: 'nketiaoteng@gmail.com', order: 1 },
    { year: '2000', name: 'Bernice Yaa Nyarkoah', contact: '0244953501', email: 'bernice.nyarkoa@gmail.com', order: 2 },
    { year: '2001', name: 'Dr. Ebo Amuah', contact: '0245408097', email: 'ebo.amuah@ucc.edu.gh', order: 1 },
    { year: '2002', name: 'Ishmael Arthur', contact: '0243981441', email: 'arthurishmael20@gmail.com', order: 1 },
    { year: '2002', name: 'Lucy Attram', contact: '0243840259', order: 2 },
    { year: '2003', name: 'Lovinna Yankson', contact: '0249376853', email: 'obaakukua2@gmail.com', order: 1 },
    { year: '2003', name: 'Regina Baaba Arkoh', contact: '0242028372', email: 'regina.arkoh@ucc.edu.gh', order: 2 },
    { year: '2004', name: 'Samuel Arkafie Jabez', order: 1 },
    { year: '2005', name: 'Bartholomew Eduku', contact: '0249206790', email: 'beduku@gmail.com', order: 1 },
    { year: '2005', name: 'David Nii-okai', contact: '0249368085', email: 'okaidavid9@gmail.com', order: 2 },
    { year: '2006', name: 'Ntow Kwaku Kwayisi', contact: '0244890458', email: 'nanayisi2006@gmail.com', order: 1 },
    { year: '2007', name: 'Comfort Abakah', contact: '0543261454', email: 'biggy30biggs@gmail.com', order: 1 },
    { year: '2007', name: 'Dauda Quansah', contact: '0509504848', email: 'bravebaah@gmail.com', order: 2 },
    { year: '2008', name: 'Michael Essien', contact: '+1 (929) 416-7528', order: 1 },
    { year: '2008', name: 'Nina Danso', contact: '0509912000', email: 'nanaakosua90@gmail.com', order: 2 },
    { year: '2009', name: 'Frederick Bankole', contact: '0503214850', email: 'bankolefrederick2019@gmail.com', order: 1 },
    { year: '2009', name: 'Ibrahim Alhassan', contact: '0558118152', email: 'landlaud4real@gmail.com', order: 2 },
    { year: '2011', name: 'Albert Kayang', contact: '0247952965', email: 'albertkayang@gmail.com', order: 1 },
    { year: '2011', name: 'Winnie Abena A. Anim', contact: '0247653987', email: 'winnie.anim001@stu.ucc.egu.gh', order: 2 },
    { year: '2012', name: 'Geoffrey Nanah', contact: '0553498515', email: 'nanahgeoffrey@gmail.com', order: 1 },
    { year: '2012', name: 'Jennifer Odame Darkwah', contact: '0542226407', email: 'gyaabaefua@gmail.com', order: 2 },
    { year: '2013 (4 years)', name: 'Hetty Challey Cudjoe', contact: '0247308888', email: 'hettychalleycudjoe@gmail.com', order: 1 },
    { year: '2013 (3 Years)', name: 'Emmanuel Arkaifie', contact: '0541234402', email: 'emmanuelarkaifie114@gmail.com', order: 1 },
    { year: '2013 (3 Years)', name: 'Samuel Kojo Afful', contact: '0560705435', email: 'samuelmarley41@gmail.com', order: 2 },
    { year: '2014', name: 'Prince Prah', contact: '0547958388', email: 'pprah1996@gmail.com', order: 1 },
    { year: '2014', name: 'Kingsford Ennim', contact: '0544850057', email: 'kingkreamy@gmail.com', order: 2 },
    { year: '2015', name: 'Abubakar Abdul Mumin', contact: '0538485124', email: 'abubakarmumin53@gmail.com', order: 1 },
    { year: '2015', name: 'Elizabeth Assefuah', contact: '0245387862', email: 'elizabethassefuah@gmail.com', order: 2 },
    { year: '2016', name: 'Jude Harrison Doughan', contact: '058273681', email: 'doughanjude11@gmail.com', order: 1 },
    { year: '2016', name: 'Benjamin Michael Dadzie', contact: '+1(864)7657552', email: 'doughanjude11@gmail.com', order: 2 },
    { year: '2018', name: 'Anthony Eshun', contact: '0541483260', order: 1 },
    { year: '2018', name: 'Myra Dora Annobil', contact: '0543584273', email: 'myrababe56@gmail.com', order: 2 },
    { year: '2019', name: 'Nana Yaw Osei', contact: '0546513314', email: 'yawosei77@gmail.com', order: 1 },
    { year: '2019', name: 'Maame Efua Arhin', contact: '0541755035', email: 'maameefua433@gmail.com', order: 2 },
    { year: '2020', name: 'Samuel Bentum Yawson', contact: '0543399458', email: 'yawsonsamuelbentum@gmail.com', order: 1 },
    { year: '2020', name: 'Samuella Esi Arhin Tachie', contact: '0266251275/0594386508', email: 'samuella.tachie@stu.ucc.edu.gh', order: 2 },
    { year: '2021', name: 'Collete Abena Frimpong', contact: '0256429884', email: 'frimpongcolette27@gmail.com', order: 1 },
    { year: '2022', name: 'Godfred Ofosu', contact: '0501856840', email: 'asedagodfred@gmail.com', order: 1 },
    { year: '2022', name: 'Wendy Adjeley Adjei', contact: '0557463117', email: 'wendyadjei2004@gmail.com', order: 2 },
    { year: '2023', name: 'Justice Enyam Dey', contact: '0597323871', email: 'justicedey650@gmail.com', order: 1 },
    { year: '2024', name: 'Issabella Amoako', contact: '0530890188', email: 'siamoakowaa74@gmail.com', order: 1 },
  ];

  await db.collection('year_group_reps').insertMany(reps);
  console.log(`Seeded ${reps.length} year group reps.`);

  // Seed admin accounts
  console.log('Seeding admin accounts...');
  const adminPassword = await bcrypt.hash('admin123', 12);
  await db.collection('admins').deleteMany({});
  const admins = [
    {
      fullName: 'Super Admin',
      email: 'admin@uposa.org',
      password: adminPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      fullName: 'Geoffrey Nanah',
      email: 'geoffrey@uposa.org',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
  await db.collection('admins').insertMany(admins);
  console.log(`Seeded ${admins.length} admin accounts.`);

  // Seed member accounts
  console.log('Seeding member accounts...');
  const memberPassword = await bcrypt.hash('demo123', 12);
  await db.collection('members').deleteMany({});
  const members = [
    {
      fullName: 'Kwame Mensah',
      email: 'kwame@uposa.org',
      password: memberPassword,
      gender: 'MALE',
      yearGroup: 2010,
      programme: 'SCIENCE',
      house: 'NKRUMAH',
      mobileNumber: '0241234567',
      city: 'Accra',
      region: 'Greater Accra',
      country: 'Ghana',
      occupation: 'Software Engineer',
      organization: 'MTN Ghana',
      areaOfExpertise: ['Information Technology (IT)', 'Business & Entrepreneurship'],
      employmentType: 'PRIVATE_WORKER',
      membershipStatus: 'ACTIVE',
      isApproved: true,
      approvedAt: now,
      isVerified: true,
      consentGiven: true,
      isAvailableAsMentor: true,
      mentorBio: 'Experienced software engineer with 10+ years in the tech industry.',
      isWhatsAppMember: true,
      willingToVolunteer: 'YES',
      preferredContributions: ['Mentorship', 'Financial Support'],
      photoUrl: null,
      verificationToken: null,
      resetToken: null,
      resetTokenExpiry: null,
      altPhoneNumber: null,
      residentialAddress: 'East Legon, Accra',
      dateOfBirth: new Date('1992-05-15'),
      maritalStatus: 'MARRIED',
      emergencyContactNumber: '0209876543',
      emergencyRelationship: 'Spouse',
      nextOfKinName: 'Ama Mensah',
      nextOfKinContact: '0209876543',
      nextOfKinRelationship: 'Spouse',
      createdAt: now,
      updatedAt: now,
    },
    {
      fullName: 'Abena Osei',
      email: 'abena@uposa.org',
      password: memberPassword,
      gender: 'FEMALE',
      yearGroup: 2015,
      programme: 'BUSINESS',
      house: 'VOLTA',
      mobileNumber: '0557654321',
      city: 'Kumasi',
      region: 'Ashanti',
      country: 'Ghana',
      occupation: 'Accountant',
      organization: 'PwC Ghana',
      areaOfExpertise: ['Finance, Banking & Accounting'],
      employmentType: 'PRIVATE_WORKER',
      membershipStatus: 'ACTIVE',
      isApproved: true,
      approvedAt: now,
      isVerified: true,
      consentGiven: true,
      isAvailableAsMentor: false,
      mentorBio: null,
      isWhatsAppMember: true,
      willingToVolunteer: 'MAYBE',
      preferredContributions: ['Financial Support'],
      photoUrl: null,
      verificationToken: null,
      resetToken: null,
      resetTokenExpiry: null,
      altPhoneNumber: null,
      residentialAddress: 'Ahodwo, Kumasi',
      dateOfBirth: new Date('1997-08-22'),
      maritalStatus: 'SINGLE',
      emergencyContactNumber: '0241112233',
      emergencyRelationship: 'Parent',
      nextOfKinName: 'Yaw Osei',
      nextOfKinContact: '0241112233',
      nextOfKinRelationship: 'Father',
      createdAt: now,
      updatedAt: now,
    },
    {
      fullName: 'Kofi Asante',
      email: 'kofi@uposa.org',
      password: memberPassword,
      gender: 'MALE',
      yearGroup: 2008,
      programme: 'GENERAL_ARTS',
      house: 'ACKAH',
      mobileNumber: '0243334455',
      city: 'Cape Coast',
      region: 'Central',
      country: 'Ghana',
      occupation: 'Lecturer',
      organization: 'University of Cape Coast',
      areaOfExpertise: ['Education & Teaching', 'Research & Academia'],
      employmentType: 'GOVERNMENT_WORKER',
      membershipStatus: 'ACTIVE',
      isApproved: true,
      approvedAt: now,
      isVerified: true,
      consentGiven: true,
      isAvailableAsMentor: true,
      mentorBio: 'Passionate educator and researcher in the humanities.',
      isWhatsAppMember: true,
      willingToVolunteer: 'YES',
      preferredContributions: ['Mentorship', 'Volunteering'],
      photoUrl: null,
      verificationToken: null,
      resetToken: null,
      resetTokenExpiry: null,
      altPhoneNumber: null,
      residentialAddress: 'UCC Campus, Cape Coast',
      dateOfBirth: new Date('1990-01-10'),
      maritalStatus: 'MARRIED',
      emergencyContactNumber: '0205556677',
      emergencyRelationship: 'Spouse',
      nextOfKinName: 'Efua Asante',
      nextOfKinContact: '0205556677',
      nextOfKinRelationship: 'Spouse',
      createdAt: now,
      updatedAt: now,
    },
  ];
  await db.collection('members').insertMany(members);
  console.log(`Seeded ${members.length} member accounts.`);

  // Seed sample events
  console.log('Seeding events...');
  await db.collection('events').deleteMany({});
  const adminId = (await db.collection('admins').findOne({ email: 'admin@uposa.org' }))!._id;
  const events = [
    {
      title: 'Annual General Meeting 2026',
      slug: 'agm-2026',
      description: 'Join us for the annual general meeting featuring reports from executives, financial updates, and planning for the year ahead. All alumni are encouraged to attend to shape the future of UPOSA.',
      date: new Date('2026-08-15T10:00:00Z'),
      endDate: new Date('2026-08-15T16:00:00Z'),
      location: 'University Practice SHS Main Hall, Cape Coast',
      status: 'UPCOMING',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
      rsvpLink: null,
      createdById: adminId,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Alumni Homecoming Weekend',
      slug: 'homecoming-2026',
      description: 'A weekend of reunion, nostalgia, and community. Tour the school, meet old classmates, enjoy cultural performances, and celebrate our legacy together.',
      date: new Date('2026-10-20T09:00:00Z'),
      endDate: new Date('2026-10-22T18:00:00Z'),
      location: 'University Practice SHS, Cape Coast',
      status: 'UPCOMING',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1529543544282-ea57407bc2f3?w=800&q=80',
      rsvpLink: null,
      createdById: adminId,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'NSMQ Alumni Support Night',
      slug: 'nsmq-support-night-2026',
      description: 'Rally behind our NSMQ team! Join fellow alumni for a special viewing party and fundraiser to support the school\'s National Science & Maths Quiz preparation.',
      date: new Date('2026-07-12T18:00:00Z'),
      endDate: new Date('2026-07-12T22:00:00Z'),
      location: 'Accra City Hotel, Accra',
      status: 'UPCOMING',
      isFeatured: true,
      imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80',
      rsvpLink: null,
      createdById: adminId,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Career & Mentorship Fair',
      slug: 'career-mentorship-fair-2026',
      description: 'Connect with alumni professionals across various industries. Get career guidance, internship opportunities, and build lasting professional relationships.',
      date: new Date('2026-09-05T09:00:00Z'),
      endDate: new Date('2026-09-05T16:00:00Z'),
      location: 'University of Cape Coast Auditorium',
      status: 'UPCOMING',
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80',
      rsvpLink: null,
      createdById: adminId,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Founders\' Day Celebration',
      slug: 'founders-day-2026',
      description: 'Celebrate the founding of University Practice Senior High School with speeches, cultural displays, and an awards ceremony honouring outstanding alumni.',
      date: new Date('2026-11-28T10:00:00Z'),
      endDate: new Date('2026-11-28T17:00:00Z'),
      location: 'University Practice SHS Assembly Hall, Cape Coast',
      status: 'UPCOMING',
      isFeatured: false,
      imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80',
      rsvpLink: null,
      createdById: adminId,
      createdAt: now,
      updatedAt: now,
    },
  ];
  await db.collection('events').insertMany(events);
  console.log(`Seeded ${events.length} events.`);

  // Seed sample news
  console.log('Seeding news...');
  await db.collection('news').deleteMany({});
  const d = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const newsItems = [
    // ─── ANNOUNCEMENTS ────────────────────────────────────────
    { title: 'UPOSA Launches New Website', slug: 'uposa-launches-new-website', content: 'We are excited to announce the launch of our brand new UPOSA website! The new platform provides a modern, user-friendly experience for all alumni to stay connected, register, pay dues, and participate in association activities.\n\nKey features include online alumni registration, dues and donation management, event listings and RSVP, project tracking, and a community forum with job board.\n\nWe encourage all alumni to register and explore the new platform.', excerpt: 'The official UPOSA website is now live with features for alumni registration, dues, events, and community engagement.', category: 'ANNOUNCEMENT', authorName: 'UPOSA Communications', isFeatured: true, isPublished: true, publishedAt: d(0), imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80', createdById: adminId, createdAt: d(0), updatedAt: d(0) },
    { title: 'Annual Dues Payment Now Open for 2026', slug: 'annual-dues-2026-open', content: 'The 2026 annual dues payment window is now open. All active members are encouraged to make their payments before the 30th June deadline.\n\nPayments can be made via Mobile Money, bank transfer, or through the new online payment portal on the website. Lifetime membership options are also available for those who wish to make a one-time contribution.\n\nContact the Treasurer for any payment-related inquiries.', excerpt: 'The 2026 dues payment window is open. Pay via MoMo, bank transfer, or the new online portal before June 30th.', category: 'ANNOUNCEMENT', authorName: 'Robert Ofori Abosompim', isFeatured: false, isPublished: true, publishedAt: d(3), imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80', createdById: adminId, createdAt: d(3), updatedAt: d(3) },
    { title: 'UPOSA Donates 500 Textbooks to School Library', slug: 'textbook-donation-2026', content: 'UPOSA has donated 500 new textbooks to the University Practice SHS library, covering core subjects including Mathematics, English, Integrated Science, and Social Studies.\n\nThe donation was made possible by contributions from alumni across Ghana and the diaspora. The books were presented during a brief ceremony attended by the school management and executive team.', excerpt: '500 new textbooks donated to the school library covering core WASSCE subjects.', category: 'ANNOUNCEMENT', authorName: 'UPOSA Communications', isFeatured: false, isPublished: true, publishedAt: d(45), imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80', createdById: adminId, createdAt: d(45), updatedAt: d(45) },
    { title: 'New Executive Council Inaugurated', slug: 'new-executive-council-2026', content: 'The newly elected UPOSA Executive Council has been officially inaugurated at a ceremony held at the school premises. The council, led by President Emmanuel Paul Owusu, pledged to advance the association\'s mission of supporting UPSHS and empowering alumni.\n\nKey priorities for the new term include completing the Science Lab Renovation, launching the ICT Centre Project, and expanding the mentorship programme to reach more students.', excerpt: 'The new UPOSA Executive Council has been inaugurated, pledging to advance school development and alumni welfare.', category: 'ANNOUNCEMENT', authorName: 'Geoffrey Nanah', isFeatured: true, isPublished: true, publishedAt: d(60), imageUrl: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80', createdById: adminId, createdAt: d(60), updatedAt: d(60) },
    { title: 'UPOSA Constitution Amended at AGM', slug: 'constitution-amendment-2025', content: 'Members voted to approve several amendments to the UPOSA Constitution during the Annual General Meeting. Key changes include updated membership categories, revised dues structure, and new provisions for diaspora chapter governance.\n\nThe amended constitution is now available for download on the website. All members are encouraged to familiarize themselves with the updated document.', excerpt: 'Constitutional amendments approved at AGM covering membership categories, dues, and diaspora governance.', category: 'ANNOUNCEMENT', authorName: 'Efua Sekyiwa Assan', isFeatured: false, isPublished: true, publishedAt: d(90), imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80', createdById: adminId, createdAt: d(90), updatedAt: d(90) },

    // ─── NEWS ─────────────────────────────────────────────────
    { title: 'UPSHS Students Excel at 2025 WASSCE', slug: 'upshs-wassce-2025-results', content: 'University Practice Senior High School has recorded impressive results in the 2025 WASSCE examinations. The school achieved a 96% pass rate, with 15 students earning straight A\'s across all subjects.\n\nThe Science department performed exceptionally well, with all General Science students qualifying for university admission. Headmaster Mr. Isaac Appiah attributed the success to dedicated teachers and the support of the alumni association.', excerpt: 'UPSHS records 96% pass rate at 2025 WASSCE with 15 students earning straight A\'s.', category: 'NEWS', authorName: 'UPOSA Communications', isFeatured: true, isPublished: true, publishedAt: d(5), imageUrl: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80', createdById: adminId, createdAt: d(5), updatedAt: d(5) },
    { title: 'Alumni Health Walk Raises GHS 15,000', slug: 'alumni-health-walk-2026', content: 'The annual UPOSA Health Walk held in Cape Coast attracted over 300 alumni and community members. The event raised GHS 15,000 which will be donated to the school\'s health centre.\n\nParticipants walked a 5km route through Cape Coast, ending at the school grounds with a health screening and wellness fair. Dr. Samuel Jabez Arkaifie led the medical team providing free health checks.', excerpt: 'Over 300 alumni join the annual health walk, raising GHS 15,000 for the school health centre.', category: 'NEWS', authorName: 'Geoffrey Nanah', isFeatured: false, isPublished: true, publishedAt: d(10), imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80', createdById: adminId, createdAt: d(10), updatedAt: d(10) },
    { title: 'UPSHS NSMQ Team Reaches Regional Finals', slug: 'nsmq-regional-finals-2026', content: 'The University Practice SHS National Science and Maths Quiz team has qualified for the Central Region finals after a dominant performance in the preliminary rounds. The team scored the highest points in the regional qualifiers.\n\nCoach Mr. Benjamin Amissah praised the students\' dedication and thanked UPOSA for funding the preparation materials and coaching sessions. The regional finals will be held in Cape Coast next month.', excerpt: 'UPSHS NSMQ team qualifies for Central Region finals with highest points in preliminaries.', category: 'NEWS', authorName: 'UPOSA Communications', isFeatured: true, isPublished: true, publishedAt: d(15), imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&q=80', createdById: adminId, createdAt: d(15), updatedAt: d(15) },
    { title: 'Science Lab Renovation 65% Complete', slug: 'science-lab-progress-update', content: 'The Science Lab Renovation project has reached the 65% completion milestone. New workstations have been installed, and the safety equipment upgrade is underway.\n\nProject lead Ing. Francis Dawson reports that the lab will feature modern fume hoods, chemical storage cabinets, and digital measuring instruments. The project is on track for completion by September 2026.', excerpt: 'Science Lab Renovation hits 65% completion with new workstations and safety upgrades underway.', category: 'NEWS', authorName: 'Francis Dawson', isFeatured: false, isPublished: true, publishedAt: d(20), imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80', createdById: adminId, createdAt: d(20), updatedAt: d(20) },
    { title: 'UK Chapter Hosts Fundraising Gala', slug: 'uk-chapter-gala-2026', content: 'The UPOSA UK Chapter hosted a successful fundraising gala in London, raising over GBP 8,000 for the ICT Centre Project. The event was attended by over 60 alumni based in the United Kingdom.\n\nThe evening featured a keynote speech by Prof. Akua Sarpong (Class of 1995), cultural performances, and an auction of donated artworks. The funds will be remitted to the national treasury this month.', excerpt: 'UK Chapter raises GBP 8,000 at London gala for the ICT Centre Project.', category: 'NEWS', authorName: 'UPOSA Communications', isFeatured: false, isPublished: true, publishedAt: d(28), imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', createdById: adminId, createdAt: d(28), updatedAt: d(28) },
    { title: 'UPSHS Wins Regional Debate Championship', slug: 'debate-championship-win-2026', content: 'University Practice SHS has won the 2026 Central Region Inter-School Debate Championship, defeating Mfantsipim School in the finals. The team argued in favour of the motion "Social media does more harm than good to education."\n\nTeam captain Priscilla Mensah was named Best Speaker. The school will represent the Central Region at the national championship in Accra.', excerpt: 'UPSHS wins Central Region Debate Championship, defeating Mfantsipim in the finals.', category: 'NEWS', authorName: 'UPOSA Communications', isFeatured: false, isPublished: true, publishedAt: d(35), imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80', createdById: adminId, createdAt: d(35), updatedAt: d(35) },
    { title: 'Alumni Donate Computers to ICT Lab', slug: 'computer-donation-2026', content: 'A group of alumni in the tech industry have donated 20 refurbished laptops to the school\'s ICT department. The donation was coordinated by the Accra Chapter\'s Tech Working Group.\n\nThe laptops have been loaded with educational software and will be used by students preparing for the WASSCE ICT practical exams. Additional peripherals including printers and projectors were also included.', excerpt: '20 refurbished laptops donated by tech-industry alumni for ICT practical exam preparation.', category: 'NEWS', authorName: 'Derrick Ofori Kwafo', isFeatured: false, isPublished: true, publishedAt: d(42), imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80', createdById: adminId, createdAt: d(42), updatedAt: d(42) },

    // ─── BLOG ─────────────────────────────────────────────────
    { title: 'Scholarship Fund Reaches GHS 50,000 Milestone', slug: 'scholarship-fund-milestone', content: 'Thanks to the generous contributions of our alumni, the UPOSA Scholarship Fund has reached the GHS 50,000 milestone. This fund supports deserving students at University Practice SHS with tuition, books, and learning materials.\n\nSince its inception, the fund has supported over 35 students across various year groups. We thank every alumnus who has contributed and encourage continued support.', excerpt: 'The UPOSA Scholarship Fund has crossed the GHS 50,000 mark, supporting over 35 students at UPSHS.', category: 'BLOG', authorName: 'Robert Ofori Abosompim', isFeatured: true, isPublished: true, publishedAt: d(7), imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80', createdById: adminId, createdAt: d(7), updatedAt: d(7) },
    { title: 'Accra Chapter Launches Mentorship Programme', slug: 'accra-chapter-mentorship-launch', content: 'The Accra Chapter of UPOSA has officially launched a structured mentorship programme connecting current UPSHS students with alumni professionals. The programme pairs students with mentors in their field of interest for a one-year guided journey.\n\nOver 40 alumni have already signed up as mentors across fields including medicine, engineering, law, technology, and business.', excerpt: 'Accra Chapter pairs 40+ alumni mentors with current students in a structured one-year programme.', category: 'BLOG', authorName: 'Efua Sekyiwa Assan', isFeatured: false, isPublished: true, publishedAt: d(12), imageUrl: 'https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=800&q=80', createdById: adminId, createdAt: d(12), updatedAt: d(12) },
    { title: 'My Journey from UPSHS to Silicon Valley', slug: 'upshs-to-silicon-valley', content: 'When I walked through the gates of University Practice SHS in 2003, I had no idea that the friendships and lessons I would gain there would carry me all the way to California.\n\nThe discipline instilled by our teachers, the camaraderie of Nkrumah House, and the competitive spirit of NSMQ preparation all shaped the engineer I am today. I now lead a team at a major tech company, and I credit my foundation to UPSHS.\n\nTo current students: your school is preparing you for greatness. Embrace every opportunity.', excerpt: 'An alumnus shares how UPSHS laid the foundation for a career in Silicon Valley\'s tech industry.', category: 'BLOG', authorName: 'Ing. Yaw Boateng', isFeatured: false, isPublished: true, publishedAt: d(18), imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80', createdById: adminId, createdAt: d(18), updatedAt: d(18) },
    { title: 'Why I Volunteer as an NSMQ Coach', slug: 'why-i-volunteer-nsmq-coach', content: 'Three years ago, I started volunteering as an NSMQ coach at UPSHS. Every Saturday morning, I drive from Accra to Cape Coast to work with some of the brightest young minds in the country.\n\nThe reward is not monetary — it\'s seeing a student\'s eyes light up when a concept clicks, watching the team grow in confidence, and knowing that we are nurturing future scientists and engineers.\n\nIf you have expertise in science or maths, I encourage you to consider volunteering. The school needs us.', excerpt: 'A volunteer NSMQ coach shares why giving back to UPSHS through coaching is deeply rewarding.', category: 'BLOG', authorName: 'Dr. Kwesi Aidoo', isFeatured: false, isPublished: true, publishedAt: d(25), imageUrl: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&q=80', createdById: adminId, createdAt: d(25), updatedAt: d(25) },
    { title: 'Building Bridges: The Diaspora Connection', slug: 'building-bridges-diaspora', content: 'Living abroad does not mean being disconnected from your roots. The UPOSA diaspora chapters in the UK, USA, and Canada have proven that distance is no barrier to making an impact.\n\nFrom fundraising galas to virtual mentorship sessions, alumni abroad have contributed significantly to the school\'s development. The new website makes it even easier to stay connected and contribute from anywhere in the world.\n\nWe are stronger together, no matter where we are.', excerpt: 'How diaspora alumni chapters in UK, USA, and Canada are driving impact from abroad.', category: 'BLOG', authorName: 'Nana Akosua Gyamfiaba II', isFeatured: false, isPublished: true, publishedAt: d(33), imageUrl: 'https://images.unsplash.com/photo-1529543544282-ea57407bc2f3?w=800&q=80', createdById: adminId, createdAt: d(33), updatedAt: d(33) },
    { title: 'The Power of Alumni Networks in Career Growth', slug: 'alumni-networks-career-growth', content: 'Your alumni network is one of the most valuable assets you possess. Throughout my career in finance, UPOSA connections have opened doors that I never expected.\n\nFrom job referrals to business partnerships, the bonds formed at UPSHS have proven invaluable. The new alumni directory on the website makes it easy to find fellow alumni in your industry and location.\n\nI encourage every alumnus to register and make themselves visible. You never know who might be looking for someone with your expertise.', excerpt: 'How leveraging your UPOSA alumni network can accelerate career growth and open unexpected doors.', category: 'BLOG', authorName: 'Robert Ofori Abosompim', isFeatured: false, isPublished: true, publishedAt: d(50), imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80', createdById: adminId, createdAt: d(50), updatedAt: d(50) },
    { title: 'Reflections on 50 Years of UPSHS', slug: 'reflections-50-years-upshs', content: 'As we approach the 50th anniversary of University Practice Senior High School, it is worth reflecting on the journey that brought us here.\n\nFrom humble beginnings as a practice school for the University of Cape Coast\'s education students, UPSHS has grown into one of the most respected secondary schools in the Central Region. Thousands of alumni have gone on to become doctors, engineers, teachers, entrepreneurs, and leaders across every sector.\n\nThe next 50 years belong to the current generation. Let us ensure they have every tool they need to succeed.', excerpt: 'A reflection on UPSHS\'s journey from a UCC practice school to one of Central Region\'s top institutions.', category: 'BLOG', authorName: 'Emmanuel Paul Owusu', isFeatured: true, isPublished: true, publishedAt: d(55), imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80', createdById: adminId, createdAt: d(55), updatedAt: d(55) },
    { title: 'How UPOSA Changed My Perspective on Giving', slug: 'uposa-changed-my-perspective', content: 'I used to think giving back meant writing a cheque. UPOSA showed me that giving comes in many forms — time, expertise, connections, and presence.\n\nWhen I mentored my first student through the programme, I realised that a one-hour conversation could change someone\'s trajectory. When I volunteered at the health walk, I saw the community impact firsthand.\n\nGiving is not about how much you have. It\'s about showing up.', excerpt: 'An alumna shares how UPOSA broadened her understanding of giving back beyond financial contributions.', category: 'BLOG', authorName: 'Efua Sekyiwa Assan', isFeatured: false, isPublished: true, publishedAt: d(65), imageUrl: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80', createdById: adminId, createdAt: d(65), updatedAt: d(65) },
    { title: 'A Teacher\'s Impact: Remembering Mr. Kwadwo Mensah', slug: 'remembering-mr-mensah', content: 'Every alumnus has that one teacher who changed everything. For many of us in the Class of 2000, that teacher was Mr. Kwadwo Mensah.\n\nHis Mathematics lessons were legendary — not because they were easy, but because he made every student believe they could master the subject. He stayed after hours, organised weekend study sessions, and never gave up on even the most reluctant learner.\n\nMr. Mensah retired last year after 30 years of service. This tribute is our way of saying thank you.', excerpt: 'A heartfelt tribute to Mr. Kwadwo Mensah, a beloved Mathematics teacher who inspired generations of students.', category: 'BLOG', authorName: 'Dr. Samuel Jabez Arkaifie', isFeatured: false, isPublished: true, publishedAt: d(75), imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80', createdById: adminId, createdAt: d(75), updatedAt: d(75) },
    { title: 'Sports Day Memories: The House That Never Gave Up', slug: 'sports-day-memories', content: 'Every year, Sports Day at UPSHS was the highlight of the term. The rivalry between the houses — Ackah, Densu, Tano, Nkrumah, Pra, and Volta — was fierce but always friendly.\n\nI remember the year Pra House was trailing in every event until the relay finals. Against all odds, our 4x400m team came from behind to win, and the celebrations lasted well into the evening.\n\nThose moments taught us about resilience, teamwork, and the joy of supporting each other. Lessons that have served us well beyond the school gates.', excerpt: 'An alumnus relives the house rivalries, come-from-behind victories, and life lessons of UPSHS Sports Day.', category: 'BLOG', authorName: 'Geoffrey Nanah', isFeatured: false, isPublished: true, publishedAt: d(85), imageUrl: 'https://images.unsplash.com/photo-1461896836934-bd45ba6b4907?w=800&q=80', createdById: adminId, createdAt: d(85), updatedAt: d(85) },
  ];
  await db.collection('news').insertMany(newsItems);
  console.log(`Seeded ${newsItems.length} news articles.`);

  // Seed sample projects
  console.log('Seeding projects...');
  await db.collection('projects').deleteMany({});
  const projectItems = [
    {
      title: 'Science Lab Renovation',
      slug: 'science-lab-renovation',
      description: 'Upgrading the school science laboratory with modern equipment, new workstations, and improved safety features to support practical learning.',
      content: '## Project Overview\n\nThe Science Lab Renovation project aims to transform the existing science laboratory at University Practice SHS into a modern, fully-equipped facility that meets international standards.\n\n## Why This Matters\n\nPractical science education is critical for students pursuing STEM careers. Our current lab has outdated equipment dating back over 15 years, with many instruments no longer functional. This renovation will directly impact over **1,500 students** annually.\n\n## What We\'re Doing\n\n- **New lab benches** with built-in gas taps and electrical outlets\n- **Modern microscopes** (20 compound microscopes for Biology)\n- **Chemistry equipment** including fume hoods, digital scales, and glassware\n- **Physics apparatus** for mechanics, optics, and electricity experiments\n- **Safety upgrades** including fire extinguishers, eye wash stations, and ventilation\n\n## Impact\n\nThis renovation will enable students to conduct experiments that were previously impossible, significantly improving their practical skills and WASSCE science scores.',
      goalAmount: 80000,
      raisedAmount: 52000,
      status: 'ONGOING',
      isFeatured: true,
      startDate: new Date('2025-06-01'),
      endDate: null,
      imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80',
        'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80',
        'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&q=80',
      ],
      milestones: [
        { title: 'Architectural plans completed', description: 'Blueprints approved by school board', date: '2025-07-15', completed: true },
        { title: 'Demolition & site preparation', description: 'Old fixtures removed and walls prepped', date: '2025-09-01', completed: true },
        { title: 'New plumbing & electrical work', description: 'Gas lines, water pipes, and power outlets installed', date: '2025-11-15', completed: true },
        { title: 'Lab bench installation', description: '24 new benches with built-in utilities', date: '2026-02-01', completed: false },
        { title: 'Equipment procurement', description: 'Microscopes, chemicals, and apparatus delivered', date: '2026-04-01', completed: false },
        { title: 'Grand opening ceremony', description: 'Official commissioning with UPOSA executives', date: '2026-06-01', completed: false },
      ],
      createdById: adminId,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'ICT Centre Project',
      slug: 'ict-centre-project',
      description: 'Building a state-of-the-art ICT centre with 50 computers, projectors, and internet connectivity for students to gain digital skills.',
      content: '## Project Overview\n\nThe ICT Centre Project will establish a dedicated computer laboratory and digital learning hub at University Practice SHS, equipping students with essential 21st-century digital skills.\n\n## The Need\n\nIn today\'s digital economy, computer literacy is not optional — it\'s essential. Currently, the school has only **8 functional computers** for over 1,500 students. This project will change that dramatically.\n\n## Planned Facilities\n\n- **50 desktop computers** with up-to-date software\n- **2 smart projectors** for interactive lessons\n- **High-speed internet** via fiber optic connection\n- **Dedicated server room** for the school network\n- **Air-conditioned environment** for equipment longevity\n- **Printer and scanner station** for student use\n\n## Curriculum Integration\n\nThe centre will support ICT lessons, WASSCE exam preparation, coding clubs, and teacher training workshops. We are partnering with the Ghana Education Service to develop a comprehensive digital literacy curriculum.',
      goalAmount: 150000,
      raisedAmount: 60000,
      status: 'ONGOING',
      isFeatured: true,
      startDate: new Date('2025-09-01'),
      endDate: null,
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80',
        'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80',
      ],
      milestones: [
        { title: 'Building structure completed', description: 'Walls, roof, and floor tiling done', date: '2025-12-01', completed: true },
        { title: 'Electrical & networking', description: 'Power, data cabling, and Wi-Fi setup', date: '2026-02-15', completed: false },
        { title: 'Furniture & fixtures', description: 'Computer desks, chairs, and AC units', date: '2026-04-01', completed: false },
        { title: 'Computer procurement', description: '50 PCs with monitors and accessories', date: '2026-06-01', completed: false },
        { title: 'Software & training', description: 'OS installation, software setup, teacher training', date: '2026-07-01', completed: false },
      ],
      createdById: adminId,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Library Expansion & Modernisation',
      slug: 'library-expansion',
      description: 'Expanding the school library with a new reading wing, digital resource section, and air conditioning.',
      content: '## About This Project\n\nThe library is the heart of any academic institution. This expansion project will double the capacity of the University Practice SHS library and introduce digital learning resources.\n\n## Key Features\n\n- **New reading wing** with 60 additional seats\n- **Digital resource corner** with 10 tablets for e-book access\n- **Quiet study rooms** for exam preparation\n- **Air conditioning** throughout the facility\n- **5,000 new books** across all WASSCE subjects\n\n## Timeline\n\nConstruction is expected to take 8 months from groundbreaking to completion.',
      goalAmount: 120000,
      raisedAmount: 38000,
      status: 'ONGOING',
      isFeatured: true,
      startDate: new Date('2026-01-15'),
      endDate: null,
      imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80',
      gallery: [],
      milestones: [
        { title: 'Feasibility study', description: 'Assessment of space and requirements', date: '2026-01-15', completed: true },
        { title: 'Architectural design', description: 'Plans for the new wing', date: '2026-03-01', completed: false },
        { title: 'Construction begins', description: 'Foundation and structure work', date: '2026-05-01', completed: false },
      ],
      createdById: adminId,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Sports Complex Development',
      slug: 'sports-complex-development',
      description: 'Developing a multi-purpose sports complex with a basketball court, running track, and changing facilities.',
      content: '## Vision\n\nA world-class sports complex to nurture athletic talent and promote physical fitness among University Practice SHS students.\n\n## Planned Facilities\n\n- Basketball court (regulation size)\n- 200m running track\n- Football pitch improvements\n- Changing rooms and showers\n- Spectator seating (200 capacity)\n- Equipment storage',
      goalAmount: 200000,
      raisedAmount: 25000,
      status: 'ONGOING',
      isFeatured: false,
      startDate: new Date('2026-03-01'),
      endDate: null,
      imageUrl: 'https://images.unsplash.com/photo-1461896836934-bd45ba6b4907?w=800&q=80',
      gallery: [],
      milestones: [
        { title: 'Land survey & planning', description: 'Site assessment and master plan', date: '2026-03-15', completed: true },
        { title: 'Fundraising target: GH₵50,000', description: 'First fundraising milestone', date: '2026-06-01', completed: false },
      ],
      createdById: adminId,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'NSMQ Preparation Fund',
      slug: 'nsmq-preparation-fund',
      description: 'Funding intensive coaching, resource materials, and competition fees for the school\'s National Science & Maths Quiz team.',
      content: '## Why Support NSMQ?\n\nThe National Science and Maths Quiz is Ghana\'s most prestigious inter-school academic competition. University Practice SHS has a proud history of participation, and with proper funding, we believe our team can reach the **national finals**.\n\n## How Funds Are Used\n\n- **Expert coaching** — hiring specialist tutors in Physics, Chemistry, Biology, and Maths\n- **Resource materials** — past questions, textbooks, and online subscriptions\n- **Mock competitions** — organizing practice quizzes with other schools\n- **Travel & logistics** — transportation and accommodation for competitions\n- **Motivation packages** — incentives for participating students\n\n## Recent Achievements\n\n- 2025: Reached NSMQ National Semi-Finals\n- 2024: Won Central Region Qualifiers\n- 2023: Quarter-finalist at national level',
      goalAmount: 30000,
      raisedAmount: 22000,
      status: 'ONGOING',
      isFeatured: false,
      startDate: new Date('2026-02-01'),
      endDate: null,
      imageUrl: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&q=80',
      gallery: [],
      milestones: [
        { title: 'Coaching team assembled', description: '3 specialist tutors contracted', date: '2026-02-15', completed: true },
        { title: 'Resource materials acquired', description: 'Books, past questions, and subscriptions', date: '2026-03-01', completed: true },
        { title: 'Regional qualifiers', description: 'Central Region competition', date: '2026-06-15', completed: false },
        { title: 'National competition', description: 'NSMQ National Stage', date: '2026-10-01', completed: false },
      ],
      createdById: adminId,
      createdAt: now,
      updatedAt: now,
    },
  ];
  await db.collection('projects').insertMany(projectItems);
  console.log(`Seeded ${projectItems.length} projects.`);

  // Seed sample jobs
  console.log('Seeding jobs...');
  await db.collection('jobs').deleteMany({});
  const kwameId = (await db.collection('members').findOne({ email: 'kwame@uposa.org' }))!._id;
  const kofiId = (await db.collection('members').findOne({ email: 'kofi@uposa.org' }))!._id;
  const jobs = [
    {
      title: 'Junior Software Developer',
      description: 'We are looking for a motivated Junior Software Developer to join our engineering team. Experience with JavaScript/TypeScript and React is preferred. Fresh graduates from UPSHS alumni are encouraged to apply.',
      company: 'MTN Ghana',
      location: 'Accra, Ghana',
      jobType: 'FULL_TIME',
      contactEmail: 'careers@mtn.com.gh',
      externalUrl: null,
      postedById: kwameId,
      isApproved: true,
      expiresAt: new Date('2026-06-30'),
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Teaching Assistant - Mathematics',
      description: 'University of Cape Coast seeks a Teaching Assistant for the Mathematics department. Ideal for recent graduates pursuing further studies. Part-time position with flexible hours.',
      company: 'University of Cape Coast',
      location: 'Cape Coast, Ghana',
      jobType: 'PART_TIME',
      contactEmail: 'hr@ucc.edu.gh',
      externalUrl: null,
      postedById: kofiId,
      isApproved: true,
      expiresAt: new Date('2026-05-31'),
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Accounting Intern',
      description: 'PwC Ghana is offering a 6-month internship for accounting graduates. Gain hands-on experience in auditing, tax, and advisory services.',
      company: 'PwC Ghana',
      location: 'Accra, Ghana',
      jobType: 'INTERNSHIP',
      contactEmail: 'internships@pwc.com.gh',
      externalUrl: 'https://pwc.com.gh/careers',
      postedById: kwameId,
      isApproved: true,
      expiresAt: new Date('2026-07-15'),
      createdAt: now,
      updatedAt: now,
    },
  ];
  await db.collection('jobs').insertMany(jobs);
  console.log(`Seeded ${jobs.length} jobs.`);

  // Seed polls
  console.log('Seeding polls...');
  await db.collection('polls').deleteMany({});
  const polls = [
    {
      question: 'What should be the theme for the 2026 Homecoming?',
      description: 'Help us choose the theme for this year\'s alumni homecoming weekend.',
      options: [
        { text: 'Legacy & Innovation', votes: 42 },
        { text: 'Together We Rise', votes: 38 },
        { text: 'Celebrating 50 Years', votes: 55 },
        { text: 'Bridging Generations', votes: 29 },
      ],
      allowMultiple: false,
      createdById: adminId,
      status: 'ACTIVE',
      endsAt: new Date('2026-06-30'),
      createdAt: now,
      updatedAt: now,
    },
    {
      question: 'Which project should receive priority funding?',
      description: 'Vote for the project you believe should receive additional funding this quarter.',
      options: [
        { text: 'Science Lab Renovation', votes: 67 },
        { text: 'ICT Centre Project', votes: 83 },
        { text: 'Library Upgrade', votes: 45 },
      ],
      allowMultiple: false,
      createdById: adminId,
      status: 'ACTIVE',
      endsAt: new Date('2026-05-15'),
      createdAt: now,
      updatedAt: now,
    },
  ];
  await db.collection('polls').insertMany(polls);
  console.log(`Seeded ${polls.length} polls.`);

  // Seed forum posts
  console.log('Seeding forum posts...');
  await db.collection('forum_posts').deleteMany({});
  await db.collection('forum_comments').deleteMany({});
  const forumPosts = [
    {
      title: 'Welcome to the UPOSA Forum!',
      slug: 'welcome-to-uposa-forum',
      content: 'Hello fellow alumni! This is the official UPOSA community forum. Feel free to introduce yourself, share updates, ask questions, or start discussions about anything related to our alma mater and alumni community.\n\nPlease be respectful and follow the community guidelines.',
      category: 'ANNOUNCEMENTS',
      authorId: kwameId,
      viewCount: 120,
      isPinned: true,
      isLocked: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      title: 'Career Advice for Recent Graduates',
      slug: 'career-advice-recent-graduates',
      content: 'I wanted to start a thread where senior alumni can share career advice with recent graduates. What are some tips you wish you had known when starting your career?\n\nI\'ll start: Networking is everything. Don\'t be afraid to reach out to people in your field, even if you don\'t know them personally.',
      category: 'CAREERS',
      authorId: kofiId,
      viewCount: 85,
      isPinned: false,
      isLocked: false,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'NSMQ 2026 Preparations - How Can We Help?',
      slug: 'nsmq-2026-preparations',
      content: 'The school is preparing for NSMQ 2026 and they need our support. What are some ways we as alumni can contribute? I know some of us are in STEM fields and could volunteer as coaches or mentors.\n\nLet\'s brainstorm ideas here!',
      category: 'EDUCATION',
      authorId: kwameId,
      viewCount: 64,
      isPinned: false,
      isLocked: false,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  ];
  await db.collection('forum_posts').insertMany(forumPosts);
  console.log(`Seeded ${forumPosts.length} forum posts.`);

  // Seed dues
  console.log('Seeding dues...');
  await db.collection('dues').deleteMany({});
  const duesData = [
    { memberId: kwameId, amount: 120, year: 2025, status: 'PAID', paidAt: new Date('2025-03-15'), transactionRef: 'MOMO-2025-001', notes: null, createdAt: now, updatedAt: now },
    { memberId: kwameId, amount: 120, year: 2026, status: 'PENDING', paidAt: null, transactionRef: null, notes: null, createdAt: now, updatedAt: now },
    { memberId: kofiId, amount: 120, year: 2025, status: 'PAID', paidAt: new Date('2025-02-10'), transactionRef: 'BANK-2025-002', notes: null, createdAt: now, updatedAt: now },
    { memberId: kofiId, amount: 120, year: 2026, status: 'OVERDUE', paidAt: null, transactionRef: null, notes: null, createdAt: now, updatedAt: now },
  ];
  await db.collection('dues').insertMany(duesData);
  console.log(`Seeded ${duesData.length} dues records.`);

  // Seed donations
  console.log('Seeding donations...');
  await db.collection('donations').deleteMany({});
  const donations = [
    { memberId: kwameId, donorName: 'Kwame Mensah', donorEmail: 'kwame@uposa.org', amount: 500, currency: 'GHS', channel: 'MOMO', purpose: 'Science Lab Renovation', transactionRef: 'MOMO-DON-001', status: 'CONFIRMED', notes: null, projectId: null, createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), updatedAt: now },
    { memberId: kwameId, donorName: 'Kwame Mensah', donorEmail: 'kwame@uposa.org', amount: 200, currency: 'GHS', channel: 'MOMO', purpose: 'NSMQ Support Fund', transactionRef: 'MOMO-DON-002', status: 'CONFIRMED', notes: null, projectId: null, createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), updatedAt: now },
    { memberId: kofiId, donorName: 'Kofi Asante', donorEmail: 'kofi@uposa.org', amount: 1000, currency: 'GHS', channel: 'BANK', purpose: 'ICT Centre Project', transactionRef: 'BANK-DON-001', status: 'CONFIRMED', notes: 'Annual contribution', projectId: null, createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), updatedAt: now },
    { memberId: null, donorName: 'Anonymous Donor', donorEmail: 'donor@gmail.com', amount: 300, currency: 'GHS', channel: 'MOMO', purpose: 'General Fund', transactionRef: 'MOMO-DON-003', status: 'PENDING', notes: null, projectId: null, createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), updatedAt: now },
  ];
  await db.collection('donations').insertMany(donations);
  console.log(`Seeded ${donations.length} donations.`);

  // Seed payment methods
  console.log('Seeding payment methods...');
  await db.collection('payment_methods').deleteMany({});
  const paymentMethods = [
    {
      provider: 'PAYSTACK',
      displayName: 'Paystack',
      description: 'Pay with Mobile Money, Bank Transfer, or Card (Ghana & Nigeria)',
      isEnabled: false,
      supportedCurrencies: ['GHS', 'NGN'],
      countries: ['GH', 'NG'],
      credentials: null,
      config: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      provider: 'STRIPE',
      displayName: 'Stripe',
      description: 'Pay with Card (International)',
      isEnabled: false,
      supportedCurrencies: ['USD', 'GBP', 'EUR'],
      countries: ['*'],
      credentials: null,
      config: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      provider: 'CRYPTO',
      displayName: 'Cryptocurrency',
      description: 'Pay with Bitcoin, Ethereum, USDC, and other cryptocurrencies',
      isEnabled: false,
      supportedCurrencies: ['BTC', 'ETH', 'USDC', 'USD', 'GHS'],
      countries: ['*'],
      credentials: null,
      config: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
  await db.collection('payment_methods').insertMany(paymentMethods);
  console.log(`Seeded ${paymentMethods.length} payment methods.`);

  // Seed gallery categories + items
  console.log('Seeding gallery...');
  await db.collection('gallery_categories').deleteMany({});
  await db.collection('gallery_items').deleteMany({});

  const galleryCats = [
    { name: 'Campus & Facilities', description: 'Buildings, labs, libraries, and infrastructure on the school compound.', coverImageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80', order: 1, createdAt: now, updatedAt: now },
    { name: 'Events & Gatherings', description: 'AGMs, homecomings, galas, career fairs, and community celebrations.', coverImageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80', order: 2, createdAt: now, updatedAt: now },
    { name: 'Sports & Activities', description: 'Inter-house competitions, athletics, and co-curricular activities.', coverImageUrl: 'https://images.unsplash.com/photo-1461896836934-bd45ba6b4907?w=800&q=80', order: 3, createdAt: now, updatedAt: now },
    { name: 'Academics & Awards', description: 'NSMQ team highlights, prize giving days, and academic achievements.', coverImageUrl: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&q=80', order: 4, createdAt: now, updatedAt: now },
    { name: 'Projects', description: 'Construction progress, groundbreaking ceremonies, and completed projects.', coverImageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80', order: 5, createdAt: now, updatedAt: now },
  ];
  const catResults = await db.collection('gallery_categories').insertMany(galleryCats);
  const catIds = Object.values(catResults.insertedIds);
  console.log(`Seeded ${galleryCats.length} gallery categories.`);

  const galleryItems = [
    // Campus & Facilities (catIds[0])
    { title: 'Main School Building', caption: 'The iconic admin and classroom block', imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80', category: 'Campus & Facilities', categoryId: catIds[0], createdById: adminId, createdAt: now },
    { title: 'Science Laboratory', caption: 'Renovated lab with modern instruments', imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&q=80', category: 'Campus & Facilities', categoryId: catIds[0], createdById: adminId, createdAt: now },
    { title: 'School Library', caption: 'Expanded library with digital resources', imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80', category: 'Campus & Facilities', categoryId: catIds[0], createdById: adminId, createdAt: now },
    { title: 'ICT Computer Lab', caption: '50 desktop computers for students', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80', category: 'Campus & Facilities', categoryId: catIds[0], createdById: adminId, createdAt: now },
    { title: 'Assembly Hall', caption: 'Multipurpose hall for events and worship', imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', category: 'Campus & Facilities', categoryId: catIds[0], createdById: adminId, createdAt: now },
    // Events & Gatherings (catIds[1])
    { title: 'Annual General Meeting 2025', caption: 'AGM held in Accra with full executive attendance', imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80', category: 'Events & Gatherings', categoryId: catIds[1], createdById: adminId, createdAt: now },
    { title: 'Homecoming Weekend 2024', caption: 'Alumni reconnecting on campus', imageUrl: 'https://images.unsplash.com/photo-1529543544282-ea6407407b2d?w=800&q=80', category: 'Events & Gatherings', categoryId: catIds[1], createdById: adminId, createdAt: now },
    { title: 'Career & Mentorship Fair', caption: 'Mentors engaging with current students', imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&q=80', category: 'Events & Gatherings', categoryId: catIds[1], createdById: adminId, createdAt: now },
    { title: 'Fundraising Gala Dinner', caption: 'Gala dinner at Kempinski Hotel, Accra', imageUrl: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=800&q=80', category: 'Events & Gatherings', categoryId: catIds[1], createdById: adminId, createdAt: now },
    // Sports & Activities (catIds[2])
    { title: 'Inter-House Sports Day', caption: 'Annual inter-house athletics competition', imageUrl: 'https://images.unsplash.com/photo-1461896836934-bd45ba6b4907?w=800&q=80', category: 'Sports & Activities', categoryId: catIds[2], createdById: adminId, createdAt: now },
    // Academics & Awards (catIds[3])
    { title: 'NSMQ Team 2025', caption: 'Reached the national semi-finals', imageUrl: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=800&q=80', category: 'Academics & Awards', categoryId: catIds[3], createdById: adminId, createdAt: now },
    { title: 'Speech & Prize Giving Day', caption: 'Awards for academic excellence', imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=800&q=80', category: 'Academics & Awards', categoryId: catIds[3], createdById: adminId, createdAt: now },
    // Projects (catIds[4])
    { title: 'Science Lab Renovation Progress', caption: 'Construction work in progress', imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=800&q=80', category: 'Projects', categoryId: catIds[4], createdById: adminId, createdAt: now },
    { title: 'Library Expansion Groundbreaking', caption: 'Groundbreaking ceremony', imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80', category: 'Projects', categoryId: catIds[4], createdById: adminId, createdAt: now },
    { title: 'Borehole Project Completed', caption: 'Clean water for students', imageUrl: 'https://images.unsplash.com/photo-1504297050568-910d24c426d3?w=800&q=80', category: 'Projects', categoryId: catIds[4], createdById: adminId, createdAt: now },
  ];
  await db.collection('gallery_items').insertMany(galleryItems);
  console.log(`Seeded ${galleryItems.length} gallery items across ${galleryCats.length} categories.`);

  // Create unique indexes (skip if they already exist)
  console.log('Ensuring indexes...');
  const indexPairs: [string, Record<string, 1>][] = [
    ['members', { email: 1 }],
    ['admins', { email: 1 }],
    ['events', { slug: 1 }],
    ['projects', { slug: 1 }],
    ['news', { slug: 1 }],
    ['forum_posts', { slug: 1 }],
    ['site_config', { key: 1 }],
    ['payment_methods', { provider: 1 }],
    ['poll_votes', { pollId: 1, memberId: 1 }],
    ['election_votes', { electionId: 1, voterId: 1 }],
    ['job_applications', { jobId: 1, applicantId: 1 }],
  ];
  for (const [col, idx] of indexPairs) {
    try {
      await db.collection(col).createIndex(idx, { unique: true });
    } catch {
      // Index already exists, skip
    }
  }
  console.log('Indexes ensured.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await client.close();
  });
