import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchSiteData } from '../api/client';

// Type definitions
interface ContactConfig {
  phones: string[];
  emails: Record<string, string>;
  address: string;
  officeHours: string;
}

interface SocialConfig {
  facebook: string;
  instagram: string;
  whatsapp: string;
  [key: string]: string;
}

interface PaymentConfig {
  momo: { number: string; payId: string; accountName: string };
  bank: { bank: string; accountNo: string; accountName: string; branch: string };
}

interface DuesConfig {
  annual: number;
  lifetime: number;
  currency: string;
}

interface DonationAllocation {
  title: string;
  percentage: number;
  description: string;
}

interface MissionConfig {
  mission: string;
  vision: string;
}

interface HistoryConfig {
  paragraphs: string[];
}

interface StatsConfig {
  members: number;
  years: number;
  projects: number;
  events: number;
}

interface SchoolProgram {
  name: string;
  description: string;
}

interface SchoolLeader {
  name: string;
  position: string;
  initials: string;
}

interface SchoolAchievement {
  year: string;
  description: string;
}

interface NotableAlumni {
  name: string;
  achievement: string;
  yearGroup: string;
}

interface SchoolInfoConfig {
  name: string;
  abbreviation: string;
  founded: number;
  location: string;
  slogan: string;
  studentPopulation: number;
  teachingStaff: number;
  programs: SchoolProgram[];
  leadership: SchoolLeader[];
  achievements: SchoolAchievement[];
  notableAlumni: NotableAlumni[];
}

interface Executive {
  id: string;
  name: string;
  position: string;
  classOf: string;
  photoUrl: string | null;
  order: number;
}

interface YearGroupRep {
  name: string;
  contact?: string | null;
  email?: string | null;
}

interface EventData {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl?: string | null;
  date: string;
  endDate?: string | null;
  location?: string | null;
  status: string;
  isFeatured: boolean;
}

interface ProjectMilestone {
  title: string;
  description?: string;
  date?: string;
  completed: boolean;
}

interface ProjectData {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string | null;
  imageUrl?: string | null;
  gallery?: string[];
  milestones?: ProjectMilestone[];
  goalAmount: number;
  raisedAmount: number;
  status: string;
  isFeatured: boolean;
  startDate?: string | null;
  endDate?: string | null;
}

interface NewsData {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  category: string;
  authorName?: string | null;
  publishedAt?: string | null;
}

export interface GalleryItemData {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  category?: string;
  createdAt: string;
}

export interface SchoolLeaderData {
  id: string;
  name: string;
  position: string;
  photoUrl?: string | null;
  order: number;
}

export interface SiteData {
  config: {
    contact: ContactConfig;
    social: SocialConfig;
    payment: PaymentConfig;
    dues: DuesConfig;
    donationAllocation: DonationAllocation[];
    mission: MissionConfig;
    history: HistoryConfig;
    stats: StatsConfig;
    schoolInfo: SchoolInfoConfig;
  };
  executives: Executive[];
  yearGroupReps: Record<string, YearGroupRep[]>;
  upcomingEvents: EventData[];
  ongoingProjects: ProjectData[];
  latestNews: NewsData[];
  gallery: GalleryItemData[];
  schoolLeaders: SchoolLeaderData[];
}

interface SiteDataContextType {
  data: SiteData | null;
  loading: boolean;
  error: string | null;
}

const SiteDataContext = createContext<SiteDataContextType>({ data: null, loading: true, error: null });

export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSiteData()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SiteDataContext.Provider value={{ data, loading, error }}>
      {children}
    </SiteDataContext.Provider>
  );
}

export function useSiteData() {
  return useContext(SiteDataContext);
}
