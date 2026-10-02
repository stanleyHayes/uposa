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
    /** Uploaded in admin (About content). Null until a document is published. */
    constitution?: { url: string; summary: string } | null;
  };
  executives: Executive[];
  yearGroupReps: Record<string, YearGroupRep[]>;
  upcomingEvents: EventData[];
  ongoingProjects: ProjectData[];
  latestNews: NewsData[];
  gallery: GalleryItemData[];
  schoolLeaders: SchoolLeaderData[];
}

/**
 * Data captured at build time by scripts/prerender.mjs. It is embedded in each
 * prerendered page as JSON so the first client render matches the static HTML
 * (hydration) without waiting on the API. `pages` holds per-route API
 * responses keyed like "news", "events", "news/<slug>".
 */
export interface PrerenderPayload {
  siteData: SiteData | null;
  pages: Record<string, unknown>;
  /** Build timestamp; time-relative UI renders against it until hydrated (see useNow). */
  renderedAt?: number;
}

export const PRERENDER_DATA_ID = '__UPOSA_DATA__';

interface SiteDataContextType {
  data: SiteData | null;
  loading: boolean;
  error: string | null;
  pages: Record<string, unknown>;
  renderedAt?: number;
}

const SiteDataContext = createContext<SiteDataContextType>({ data: null, loading: true, error: null, pages: {} });

function readEmbeddedPayload(): PrerenderPayload | null {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById(PRERENDER_DATA_ID);
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent) as PrerenderPayload;
  } catch {
    return null;
  }
}

export function SiteDataProvider({ children, initialPayload }: { children: ReactNode; initialPayload?: PrerenderPayload }) {
  const [payload] = useState(() => initialPayload ?? readEmbeddedPayload());
  const [data, setData] = useState<SiteData | null>(payload?.siteData ?? null);
  const [loading, setLoading] = useState(!payload?.siteData);
  const [error, setError] = useState<string | null>(null);
  const pages = payload?.pages ?? {};

  useEffect(() => {
    // Prerendered pages already have data; refresh it quietly so content
    // published since the last build still shows up.
    fetchSiteData()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // If the API is unreachable, don't leave visitors on an endless splash —
  // pages gate on `!data`, so show a recoverable error instead.
  if (error && !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-base-100 px-6 text-center text-primary">
        <img src="/logo.webp" alt="UPOSA" className="h-16 w-16 object-contain opacity-80" />
        <div>
          <h1 className="text-2xl font-bold">We couldn't load the site right now</h1>
          <p className="mt-2 max-w-md text-base-content/60">
            The UPOSA server didn't respond. Check your connection and try again in a moment.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <SiteDataContext.Provider value={{ data, loading, error, pages, renderedAt: payload?.renderedAt }}>
      {children}
    </SiteDataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSiteData() {
  return useContext(SiteDataContext);
}

/** Build-time API response for this route, if the page was prerendered with it. */
// eslint-disable-next-line react-refresh/only-export-components
export function usePrerenderedPage<T>(key: string): T | undefined {
  return useContext(SiteDataContext).pages[key] as T | undefined;
}
