/**
 * Single source of truth for site-wide SEO values. Used by the <SEO> component,
 * the JSON-LD builders, and the build-time prerender/sitemap script, so the
 * canonical host can never drift between them again.
 *
 * The apex (uposa.org) 308-redirects to www on Vercel, so every canonical URL,
 * og:url and sitemap entry must use the www host.
 */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://www.uposa.org').replace(/\/+$/, '');
export const SITE_NAME = 'UPOSA';
export const ORG_NAME = "University Practice Old Students' Association";
export const SCHOOL_NAME = 'University Practice Senior High School';
export const DEFAULT_TITLE = "UPOSA | University Practice SHS Old Students' Association, Cape Coast";
export const DEFAULT_DESCRIPTION =
    "UPOSA is the official old students' association of University Practice Senior High School (UPSHS), Cape Coast, Ghana. Register as an alumnus, pay dues, back school projects, and reconnect with your year group.";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const LOGO_URL = `${SITE_URL}/logo.png`;
export const SOCIAL_PROFILES = [
    'https://www.facebook.com/share/1Ckq3GEdMS/',
    'https://www.instagram.com/uposanational',
];

/** Absolute URL for a site path. Root stays "/", everything else has no trailing slash. */
export function absoluteUrl(path = '/'): string {
    if (/^https?:\/\//i.test(path)) return path;
    const clean = `/${path.replace(/^\/+/, '')}`.replace(/\/+$/, '');
    return `${SITE_URL}${clean || '/'}`;
}

export interface RouteMeta {
    path: string;
    title: string;
    description: string;
    /** Breadcrumb label. */
    label: string;
    changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
    priority: number;
}

/**
 * Metadata for every static route. Titles lead with the search term people use
 * ("University Practice SHS alumni", "UPSHS old students") and stay under ~60
 * characters once the " | UPOSA" suffix is added.
 */
export const STATIC_ROUTES = {
    home: {
        path: '/',
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        label: 'Home',
        changefreq: 'weekly',
        priority: 1.0,
    },
    about: {
        path: '/about',
        title: 'About UPOSA – University Practice SHS Alumni',
        description:
            "Learn about UPOSA, the University Practice SHS old students' association: our history, mission, national executives, and the year-group network serving UPSHS, Cape Coast.",
        label: 'About',
        changefreq: 'monthly',
        priority: 0.8,
    },
    ourSchool: {
        path: '/our-school',
        title: 'University Practice Senior High School (UPSHS), Cape Coast',
        description:
            'Discover University Practice Senior High School (UPSHS) in Cape Coast, Ghana: academic programmes, school leadership, achievements, notable alumni, and gallery.',
        label: 'Our School',
        changefreq: 'monthly',
        priority: 0.8,
    },
    membership: {
        path: '/membership',
        title: 'Join UPOSA – Alumni Registration & Dues',
        description:
            'Register as a UPOSA member, find your year-group representative, and pay annual or lifetime dues to support University Practice SHS old students.',
        label: 'Membership',
        changefreq: 'monthly',
        priority: 0.9,
    },
    news: {
        path: '/news',
        title: 'UPOSA News & Announcements',
        description:
            'Latest news, announcements, reports, and stories from UPOSA and University Practice Senior High School, Cape Coast.',
        label: 'News',
        changefreq: 'daily',
        priority: 0.8,
    },
    events: {
        path: '/events',
        title: 'UPOSA Events – Reunions, Homecoming & AGM',
        description:
            'Upcoming UPOSA events: homecoming, founders day, AGM, reunions, and mentorship fairs for University Practice SHS alumni. RSVP online.',
        label: 'Events',
        changefreq: 'weekly',
        priority: 0.8,
    },
    projects: {
        path: '/projects',
        title: 'UPOSA Projects – Supporting UPSHS Students',
        description:
            "Alumni-funded projects at University Practice SHS: ICT centre, science lab, library, sports and NSMQ support. Track progress and contribute.",
        label: 'Projects',
        changefreq: 'weekly',
        priority: 0.8,
    },
    community: {
        path: '/community',
        title: 'UPOSA Community – Mentorship, Jobs & Forum',
        description:
            'Connect with University Practice SHS alumni through mentorship, job opportunities, discussions, polls, and association elections.',
        label: 'Community',
        changefreq: 'weekly',
        priority: 0.6,
    },
    donate: {
        path: '/donate',
        title: 'Donate to UPOSA – Give Back to UPSHS',
        description:
            'Give back to University Practice Senior High School. Support scholarships, facilities, and student welfare through secure Mobile Money, card, or bank donations.',
        label: 'Donate',
        changefreq: 'monthly',
        priority: 0.8,
    },
    contact: {
        path: '/contact',
        title: 'Contact UPOSA – Alumni Desk & Transcript Requests',
        description:
            'Contact the UPOSA desk for membership enquiries, UPSHS transcript requests, alumni support, and partnership opportunities.',
        label: 'Contact',
        changefreq: 'yearly',
        priority: 0.6,
    },
} satisfies Record<string, RouteMeta>;

export type StaticRouteKey = keyof typeof STATIC_ROUTES;
