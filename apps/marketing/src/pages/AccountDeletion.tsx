import { Link } from "react-router";
import SEO from "../components/common/SEO.tsx";
import { LegalPage, type LegalSection } from "../components/common/LegalPage.tsx";
import { staticPageSeo } from "../seo/structuredData.ts";
import { POLICY_UPDATED } from "../seo/site.ts";

const sections: LegalSection[] = [
    {
        id: "in-the-app",
        title: "Delete from the UPOSA mobile app",
        body: (
            <ul>
                <li>Open the UPOSA app and sign in.</li>
                <li>Go to <strong>Settings → Privacy &amp; data → Delete account</strong>.</li>
                <li>Enter your password and confirm. Your account is deleted straight away and you are signed out on all devices.</li>
            </ul>
        ),
    },
    {
        id: "on-the-web",
        title: "Delete from the member portal",
        body: (
            <ul>
                <li>Sign in at <a href="https://alumni.uposa.org/login">alumni.uposa.org</a>.</li>
                <li>Go to <strong>Settings → Privacy &amp; data → Delete account</strong>, enter your password and confirm.</li>
            </ul>
        ),
    },
    {
        id: "by-email",
        title: "Ask us by email",
        body: (
            <p>
                If you can't sign in, email <a href="mailto:membership@uposa.org">membership@uposa.org</a> from the email address on your
                account with the subject "Delete my account". To protect your account, we may ask you to confirm your identity. We
                complete email requests within 30 days.
            </p>
        ),
    },
    {
        id: "what-is-deleted",
        title: "What is deleted and what is kept",
        body: (
            <>
                <p><strong>Deleted:</strong> your name, email, phone numbers, photo, address and location, date of birth, employment and
                    next-of-kin details, directory listing and preferences, job applications, mentorship requests, event RSVPs, newsletter
                    subscription and the job adverts you posted. You can no longer sign in, and your email can be used to register again.</p>
                <p><strong>Kept:</strong> records of dues, donations and payments, which the association must keep for accounting and
                    tax purposes. They are no longer linked to your name or contact details. Forum posts and comments remain but are
                    shown as written by "Deleted member"; email us if you want specific posts removed.</p>
                <p>
                    Before deleting, you can use <strong>Download my data</strong> in the same settings screen to keep a copy. More detail
                    is in our <Link to="/privacy">Privacy Policy</Link>.
                </p>
            </>
        ),
    },
];

const AccountDeletion = () => (
    <LegalPage
        eyebrow="Your data"
        title="Delete your UPOSA account"
        intro={<p>You can delete your UPOSA account at any time from the mobile app, the member portal or by email.</p>}
        updated={POLICY_UPDATED}
        sections={sections}
        seo={<SEO {...staticPageSeo("accountDeletion")} />}
    />
);

export default AccountDeletion;
