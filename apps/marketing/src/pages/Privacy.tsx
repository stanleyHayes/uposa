import { Link } from "react-router";
import SEO from "../components/common/SEO.tsx";
import { LegalPage, type LegalSection } from "../components/common/LegalPage.tsx";
import { staticPageSeo } from "../seo/structuredData.ts";
import { POLICY_UPDATED } from "../seo/site.ts";

const sections: LegalSection[] = [
    {
        id: "who-we-are",
        title: "Who we are",
        body: (
            <>
                <p>
                    UPOSA (University Practice Old Students' Association) is the alumni association of University Practice Senior High
                    School, University of Cape Coast, Cape Coast, Ghana. We are the data controller for personal data processed through
                    www.uposa.org, the member portal at alumni.uposa.org and the UPOSA mobile app (together, the "Services").
                </p>
                <p>
                    This policy explains what we collect, why, who we share it with and the rights you have under the Data Protection
                    Act, 2012 (Act 843) of Ghana. Contact us at <a href="mailto:info@uposa.org">info@uposa.org</a>, on 0244036676 or
                    0246446333, or at University Practice Senior High School, UCC, Cape Coast.
                </p>
            </>
        ),
    },
    {
        id: "what-we-collect",
        title: "Information we collect",
        body: (
            <>
                <p><strong>When you register or update your profile:</strong></p>
                <ul>
                    <li>Full name, email address, password (stored only as a secure hash) and profile photo.</li>
                    <li>Phone numbers, gender, date of birth, marital status, residential address, city, region and country.</li>
                    <li>Year group, programme and house at University Practice SHS.</li>
                    <li>Employment type, occupation, organization and areas of expertise.</li>
                    <li>Emergency contact and next-of-kin details.</li>
                    <li>Mentorship, volunteering and contribution preferences, and whether you are in a UPOSA WhatsApp group.</li>
                </ul>
                <p><strong>When you use the Services:</strong></p>
                <ul>
                    <li>Forum posts and comments, job postings and applications (including cover letters and CV links), mentorship requests, event RSVPs, and your participation in polls and elections.</li>
                    <li>Dues and donation records: amount, currency, reference, status and the name and email used to pay.</li>
                    <li>Messages you send through our contact, transcript request and newsletter forms.</li>
                    <li>Reports you make about content or members, and the members you block. A reported member is never told who reported them.</li>
                </ul>
                <p><strong>Payments:</strong> card and mobile money details are entered directly with our payment providers (Paystack, Stripe and Coinbase Commerce). We never receive or store your full card number, CVV or mobile money PIN.</p>
                <p><strong>Technical data:</strong> our servers record IP addresses and request details to keep the Services secure and to prevent abuse. Your browser or phone stores your sign-in session and display preferences (such as light or dark mode). We do not use advertising, tracking or analytics cookies.</p>
            </>
        ),
    },
    {
        id: "why",
        title: "How and why we use it",
        body: (
            <ul>
                <li><strong>Running your membership</strong>: verifying that you are an old student, approving your registration, keeping the member register and managing dues. We do this to provide the membership you asked for.</li>
                <li><strong>Member directory</strong>: showing your name, photo, year group, programme, house, city, country, occupation, organization and expertise to other signed-in members, <em>only if you choose to appear</em>. Your email, phone numbers and address are never shown in the directory. Members who registered before 2 October 2026 appear by default and can switch this off at any time.</li>
                <li><strong>Service messages</strong>: account verification, password resets, payment receipts and important membership notices.</li>
                <li><strong>News and updates</strong>: association news by email, only if you opt in. You can opt out at any time in your settings or through the unsubscribe link in every newsletter.</li>
                <li><strong>Payments and accounting</strong>: processing dues and donations and keeping the financial records the law requires.</li>
                <li><strong>Community features</strong>: forum, jobs, mentorship, events, polls and elections, at your request. Election ballots are used only to count results and are never shown to other members.</li>
                <li><strong>Security</strong>: protecting accounts, preventing fraud and abuse, and enforcing our <Link to="/terms">Terms of Use</Link>.</li>
            </ul>
        ),
    },
    {
        id: "sharing",
        title: "Who we share it with",
        body: (
            <>
                <p>We do not sell your personal data. We share it only with:</p>
                <ul>
                    <li><strong>Other members</strong>: your directory profile (if you opt in) and anything you post in community areas.</li>
                    <li><strong>UPOSA executives and administrators</strong>: to manage membership, dues, events and elections, under confidentiality.</li>
                    <li><strong>Service providers</strong> who process data for us under contract: Render (application hosting), MongoDB Atlas (database), Vercel (website hosting), Cloudinary (photos and documents), Resend (email delivery), and Paystack, Stripe and Coinbase Commerce (payments). Our staff may use OpenAI to help draft public content such as news articles; member personal data is not sent to it.</li>
                    <li><strong>Authorities</strong>: when required by Ghanaian law or a valid legal request, or to protect the rights and safety of our members.</li>
                </ul>
            </>
        ),
    },
    {
        id: "transfers",
        title: "International transfers",
        body: (
            <p>
                Some of our service providers store or process data outside Ghana, including in the United States and the European Union.
                We choose providers that protect data with encryption, access controls and contractual commitments, and we transfer
                only what each provider needs to deliver its service.
            </p>
        ),
    },
    {
        id: "retention",
        title: "How long we keep it",
        body: (
            <ul>
                <li><strong>Account and profile data</strong>: for as long as you are a member, until you delete your account.</li>
                <li><strong>Financial records</strong> (dues, donations, payments): for as long as Ghanaian tax and accounting law requires. If you delete your account, these records are kept but no longer linked to your name or contact details.</li>
                <li><strong>Forum posts and comments</strong>: these stay after account deletion but are shown as written by "Deleted member". Ask us if you want specific posts removed.</li>
                <li><strong>Contact and transcript requests</strong>: for as long as needed to handle the request and keep a record of the correspondence.</li>
                <li><strong>Security logs</strong>: for a short period, then deleted.</li>
            </ul>
        ),
    },
    {
        id: "security",
        title: "How we protect it",
        body: (
            <p>
                The Services use encrypted HTTPS connections. Passwords and reset links are stored only as one-way hashes, payment
                provider credentials are encrypted, access to member records is limited by role, and the mobile app keeps your sign-in
                session in your phone's secure storage. No system is perfectly secure; if we become aware of a breach affecting your
                data, we will notify you and the Data Protection Commission as the law requires.
            </p>
        ),
    },
    {
        id: "your-rights",
        title: "Your rights",
        body: (
            <>
                <p>Under the Data Protection Act, 2012 (Act 843) you can:</p>
                <ul>
                    <li><strong>Access</strong> your data: use "Download my data" in your account settings, or ask us.</li>
                    <li><strong>Correct</strong> it: edit your profile at any time, or ask us to.</li>
                    <li><strong>Delete</strong> your account: in your account settings (see <Link to="/account-deletion">how to delete your account</Link>) or by emailing us.</li>
                    <li><strong>Withdraw consent or object</strong>: switch off the directory listing or news emails in your settings at any time.</li>
                    <li><strong>Complain</strong> to the Data Protection Commission of Ghana (dataprotection.org.gh) if you believe we have mishandled your data.</li>
                </ul>
                <p>
                    To use these rights by email, write to <a href="mailto:membership@uposa.org">membership@uposa.org</a> from the email address on
                    your account. We aim to respond within 30 days.
                </p>
            </>
        ),
    },
    {
        id: "children",
        title: "Children",
        body: (
            <p>
                UPOSA membership is for former students aged 18 or over, and the Services are not intended for children. If you
                believe a child has given us personal data, contact us and we will delete it.
            </p>
        ),
    },
    {
        id: "changes",
        title: "Changes to this policy",
        body: (
            <p>
                We will update the date at the top of this page when the policy changes. For significant changes, we will tell members
                by email or in the Services before they take effect.
            </p>
        ),
    },
];

const Privacy = () => (
    <LegalPage
        eyebrow="Privacy"
        title="Privacy Policy"
        intro={<p>How UPOSA collects, uses and protects the personal data of old students, donors and visitors.</p>}
        updated={POLICY_UPDATED}
        sections={sections}
        seo={<SEO {...staticPageSeo("privacy")} />}
    />
);

export default Privacy;
