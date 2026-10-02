import { absoluteUrl, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, DEFAULT_TITLE, SITE_NAME } from '../../seo/site.ts';
import { serializeJsonLd, type JsonLd } from '../../seo/structuredData.ts';

interface SEOProps {
  /** Page title. " | UPOSA" is appended unless it already names UPOSA. Omit on the home page. */
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string | null;
  ogType?: 'website' | 'article';
  /** Keep the page out of search results (not-found and error states). */
  noindex?: boolean;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  jsonLd?: JsonLd | JsonLd[];
}

const MAX_DESCRIPTION = 160;

function clampDescription(value: string): string {
  // Excerpts can fall back to raw Markdown article content.
  const text = value
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= MAX_DESCRIPTION) return text;
  const cut = text.slice(0, MAX_DESCRIPTION - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}

function buildTitle(title?: string): string {
  if (!title) return DEFAULT_TITLE;
  return /\bUPOSA\b/.test(title) ? title : `${title} | ${SITE_NAME}`;
}

/**
 * Per-page head tags. React 19 hoists <title>, <meta> and <link> into <head>
 * (and the build-time prerender writes them into each page's static HTML), so
 * every route ships exactly one title, description and canonical.
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = '/',
  ogImage,
  ogType = 'website',
  noindex = false,
  publishedTime,
  modifiedTime,
  jsonLd,
}: SEOProps) {
  const fullTitle = buildTitle(title);
  const canonicalUrl = absoluteUrl(canonicalPath);
  const image = ogImage ? absoluteUrl(ogImage) : DEFAULT_OG_IMAGE;
  const summary = clampDescription(description);

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={summary} />
      <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'} />
      {!noindex && <link rel="canonical" href={canonicalUrl} />}

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_GH" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={summary} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={fullTitle} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={summary} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      )}
    </>
  );
}
