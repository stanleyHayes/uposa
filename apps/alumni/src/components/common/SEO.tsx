import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
}

const SITE_NAME = 'UPOSA Alumni Portal';
const DEFAULT_DESCRIPTION = 'Access your UPOSA alumni account — manage dues, connect with fellow alumni, participate in polls and elections, and stay updated with the latest from University Practice SHS.';

export default function SEO({ title, description = DEFAULT_DESCRIPTION }: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
    </Helmet>
  );
}
