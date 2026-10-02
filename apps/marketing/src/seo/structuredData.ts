import { absoluteUrl, LOGO_URL, ORG_NAME, SCHOOL_NAME, SITE_NAME, SITE_URL, SOCIAL_PROFILES, STATIC_ROUTES, type StaticRouteKey } from './site.ts';

export type JsonLd = Record<string, unknown>;

export const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const SCHOOL_ID = `${SITE_URL}/our-school#school`;

interface OrgContact {
    email?: string;
    phone?: string;
    address?: string;
}

/** Site-wide Organization + WebSite graph, emitted on the home page. */
export function organizationGraph(contact: OrgContact = {}): JsonLd[] {
    return [
        {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            '@id': ORG_ID,
            name: ORG_NAME,
            alternateName: [SITE_NAME, 'University Practice Old Students Association', 'UPSHS Alumni', 'The Legit Elites'],
            url: `${SITE_URL}/`,
            logo: { '@type': 'ImageObject', url: LOGO_URL, width: 512, height: 512 },
            description: `The official old students' association of ${SCHOOL_NAME} (UPSHS), Cape Coast, Ghana.`,
            ...(contact.email && { email: contact.email }),
            ...(contact.phone && { telephone: contact.phone }),
            address: {
                '@type': 'PostalAddress',
                streetAddress: contact.address || `${SCHOOL_NAME}, University of Cape Coast`,
                addressLocality: 'Cape Coast',
                addressRegion: 'Central Region',
                addressCountry: 'GH',
            },
            sameAs: SOCIAL_PROFILES,
        },
        {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            '@id': WEBSITE_ID,
            url: `${SITE_URL}/`,
            name: SITE_NAME,
            alternateName: ORG_NAME,
            inLanguage: 'en',
            publisher: { '@id': ORG_ID },
        },
    ];
}

export function breadcrumbs(items: Array<{ name: string; path: string }>): JsonLd {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [{ name: 'Home', path: '/' }, ...items].map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: absoluteUrl(item.path),
        })),
    };
}

/** <SEO> props for a static page: its title, description, canonical and breadcrumb trail. */
export function staticPageSeo(key: StaticRouteKey, extraJsonLd: JsonLd[] = []) {
    const route = STATIC_ROUTES[key];
    return {
        title: route.title,
        description: route.description,
        canonicalPath: route.path,
        jsonLd: [breadcrumbs([{ name: route.label, path: route.path }]), ...extraJsonLd],
    };
}

interface ArticleInput {
    title: string;
    slug: string;
    description: string;
    imageUrl?: string | null;
    authorName?: string | null;
    publishedAt?: string | null;
    updatedAt?: string | null;
}

export function newsArticle(article: ArticleInput): JsonLd {
    const url = absoluteUrl(`/news/${article.slug}`);
    return {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title.slice(0, 110),
        description: article.description,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        url,
        image: [article.imageUrl || `${SITE_URL}/og-image.png`],
        ...(article.publishedAt && { datePublished: article.publishedAt }),
        ...((article.updatedAt || article.publishedAt) && { dateModified: article.updatedAt || article.publishedAt }),
        author: article.authorName
            ? { '@type': 'Person', name: article.authorName }
            : { '@type': 'Organization', name: ORG_NAME, url: `${SITE_URL}/` },
        publisher: { '@id': ORG_ID, '@type': 'Organization', name: ORG_NAME, logo: { '@type': 'ImageObject', url: LOGO_URL } },
    };
}

interface EventInput {
    title: string;
    slug: string;
    description: string;
    date: string;
    endDate?: string | null;
    location?: string | null;
    imageUrl?: string | null;
    status: string;
}

const EVENT_STATUS: Record<string, string> = {
    CANCELLED: 'https://schema.org/EventCancelled',
};

export function eventItem(event: EventInput): JsonLd {
    const location = event.location?.trim();
    return {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        description: event.description,
        startDate: event.date,
        ...(event.endDate && { endDate: event.endDate }),
        eventStatus: EVENT_STATUS[event.status] || 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: {
            '@type': 'Place',
            name: location || SCHOOL_NAME,
            address: {
                '@type': 'PostalAddress',
                streetAddress: location || SCHOOL_NAME,
                addressLocality: location ? undefined : 'Cape Coast',
                addressCountry: 'GH',
            },
        },
        image: [event.imageUrl || `${SITE_URL}/og-image.png`],
        url: absoluteUrl('/events'),
        organizer: { '@type': 'Organization', name: ORG_NAME, url: `${SITE_URL}/` },
    };
}

export function highSchool(input: { name?: string; location?: string; founded?: number }): JsonLd {
    return {
        '@context': 'https://schema.org',
        '@type': 'HighSchool',
        '@id': SCHOOL_ID,
        name: input.name || SCHOOL_NAME,
        alternateName: 'UPSHS',
        url: absoluteUrl('/our-school'),
        ...(input.founded && { foundingDate: String(input.founded) }),
        address: {
            '@type': 'PostalAddress',
            streetAddress: input.location || 'University of Cape Coast',
            addressLocality: 'Cape Coast',
            addressRegion: 'Central Region',
            addressCountry: 'GH',
        },
    };
}

/**
 * Serialize JSON-LD for an inline <script>. Escapes "<" so CMS-provided text
 * (news titles, descriptions) can never close the script tag early.
 */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
    return JSON.stringify(data).replace(/</g, '\\u003c');
}
