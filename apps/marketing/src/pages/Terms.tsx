import { Link } from "react-router";
import SEO from "../components/common/SEO.tsx";
import { LegalPage, type LegalSection } from "../components/common/LegalPage.tsx";
import { staticPageSeo } from "../seo/structuredData.ts";
import { POLICY_UPDATED } from "../seo/site.ts";

const sections: LegalSection[] = [
    {
        id: "agreement",
        title: "About these terms",
        body: (
            <p>
                These terms apply to www.uposa.org, the member portal at alumni.uposa.org and the UPOSA mobile app (the "Services"),
                operated by UPOSA (University Practice Old Students' Association), University Practice Senior High School, UCC, Cape
                Coast, Ghana. By creating an account or using the Services you agree to these terms and to our{" "}
                <Link to="/privacy">Privacy Policy</Link>.
            </p>
        ),
    },
    {
        id: "eligibility",
        title: "Membership and eligibility",
        body: (
            <ul>
                <li>Membership is open to former students of University Practice Senior High School who are 18 or older.</li>
                <li>Registrations are reviewed by the association, which may approve or decline them.</li>
                <li>You must give accurate information, keep it up to date, and keep only one account.</li>
                <li>You are responsible for keeping your password secure and for activity on your account. Tell us at once if you suspect unauthorised use.</li>
            </ul>
        ),
    },
    {
        id: "conduct",
        title: "Community conduct",
        body: (
            <>
                <p>In the forum, jobs board, mentorship and other community areas you must not:</p>
                <ul>
                    <li>Harass, threaten, defame or discriminate against anyone, or post unlawful, obscene or hateful content.</li>
                    <li>Post spam or misleading job adverts, or ask members for payment in exchange for jobs or opportunities.</li>
                    <li>Copy, scrape or use member directory information for marketing, solicitation or any purpose unrelated to the association.</li>
                    <li>Impersonate others, interfere with polls or elections, or attempt to access accounts or data that are not yours.</li>
                </ul>
                <p>
                    <strong>UPOSA has zero tolerance for objectionable content and abusive members.</strong> Offensive language is blocked
                    when you post. You can report any post, comment, job advert or member, and block members so you no longer see their
                    content. Our moderators review reports within 24 hours. Content reported by several members is hidden while it is
                    reviewed. We remove content that breaks these rules or the association's constitution, and suspend or close the
                    accounts responsible.
                </p>
            </>
        ),
    },
    {
        id: "content",
        title: "Your content",
        body: (
            <p>
                You keep ownership of what you post. You give UPOSA permission to display it within the Services for association
                purposes. You confirm that you have the right to share it and that it does not infringe anyone else's rights.
            </p>
        ),
    },
    {
        id: "payments",
        title: "Dues, donations and refunds",
        body: (
            <ul>
                <li>Membership dues and donations are paid in the amounts shown at checkout. Payments are processed by our payment providers (Paystack, Stripe or Coinbase Commerce) under their own terms. Platform fees, where they apply, are shown before you pay.</li>
                <li>Dues are payment for membership of the association and are not refundable, except where you were charged in error or more than once.</li>
                <li>Donations are voluntary and generally not refundable. If you made a mistake or were charged twice, contact us within 30 days and we will correct it.</li>
                <li>Donations to a specific project are applied to that project. If a project is completed, changed or cannot go ahead, the association may apply the funds to a similar purpose that supports the school or its students.</li>
                <li>Payment references and receipts are kept as part of the association's financial records.</li>
            </ul>
        ),
    },
    {
        id: "elections",
        title: "Polls and elections",
        body: (
            <p>
                Eligible members may vote once in each poll or election. Ballots are confidential and used only to count results.
                Results announced by the association's electoral officers are final, subject to the association's constitution.
            </p>
        ),
    },
    {
        id: "ending",
        title: "Suspension and closing your account",
        body: (
            <p>
                You can delete your account at any time (see <Link to="/account-deletion">how to delete your account</Link>). We may
                suspend or close accounts that break these terms or the association's constitution, or as required by law.
            </p>
        ),
    },
    {
        id: "liability",
        title: "Disclaimers and liability",
        body: (
            <p>
                We work to keep the Services accurate and available, but they are provided "as is" and may sometimes be interrupted.
                Jobs, mentorship offers and other member posts are provided by members, not by UPOSA, so please use your own judgement.
                To the extent permitted by Ghanaian law, UPOSA is not liable for indirect or consequential losses arising from your use
                of the Services. Nothing in these terms limits rights you have under Ghanaian law that cannot be excluded.
            </p>
        ),
    },
    {
        id: "law",
        title: "Governing law",
        body: (
            <p>
                These terms are governed by the laws of the Republic of Ghana. We will first try to resolve any dispute amicably;
                otherwise it will be decided by the courts of Ghana.
            </p>
        ),
    },
    {
        id: "contact",
        title: "Changes and contact",
        body: (
            <p>
                We may update these terms and will change the date at the top of this page when we do. For significant changes we will
                tell members before they take effect. Questions: <a href="mailto:info@uposa.org">info@uposa.org</a>, 0244036676 or 0246446333.
            </p>
        ),
    },
];

const Terms = () => (
    <LegalPage
        eyebrow="Terms"
        title="Terms of Use"
        intro={<p>The rules for using the UPOSA website, member portal and mobile app, including membership, dues, donations and community conduct.</p>}
        updated={POLICY_UPDATED}
        sections={sections}
        seo={<SEO {...staticPageSeo("terms")} />}
    />
);

export default Terms;
