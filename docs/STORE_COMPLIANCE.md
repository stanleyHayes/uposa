# UPOSA Alumni — store submission and compliance guide

Written for whoever submits the mobile app (`apps/mobile`) to Google Play and the
Apple App Store. Everything below is derived from what the code collects as of
Expo SDK 57. If you add a feature that collects new data, update this file, the
iOS privacy manifest in `apps/mobile/app.json` and both store forms together.

This is not legal advice. Have the Ghana items in section 8 confirmed by
someone qualified.

## 1. App identity

| Item | Value |
|---|---|
| App name | UPOSA Alumni |
| iOS bundle ID / Android package | `org.uposa.alumni` (both stores) |
| Version | `1.0.0` (`expo.version`) |
| Build numbers | `ios.buildNumber` 1 / `android.versionCode` 1 to start. `eas.json` uses `appVersionSource: "remote"` with `autoIncrement` on the production profile, so EAS owns the counters after the first build. |
| Production API | `https://uposa.onrender.com/api` (set per profile in `eas.json`) |
| Android target SDK | 36 (Expo SDK 57 / React Native 0.86 default). Google Play currently requires new apps and updates to target API 35 or higher, so 36 is compliant. Re-check before each submission: Google raises the minimum every August. |

## 2. URLs to enter in the store consoles

| Purpose | URL |
|---|---|
| Privacy policy | https://www.uposa.org/privacy |
| Terms of use | https://www.uposa.org/terms |
| Account deletion (Google Play "Delete account URL") | https://www.uposa.org/account-deletion |
| Support / contact | https://www.uposa.org/contact |
| Marketing site | https://www.uposa.org |

In-app, members can delete their account under **Settings → Privacy & data →
Delete account**. Apple guideline 5.1.1(v) and Google Play both require this.
The login and registration screens also link to the Privacy Policy and Terms.

## 3. What the app collects (source of truth for both forms)

All data goes to the UPOSA API over HTTPS and is tied to the member's account.
The app has **no advertising, no analytics or crash-reporting SDKs, no
tracking, and no location, contacts, camera or microphone access**. Card and
mobile-money payments are completed on the provider's own page (Paystack,
Stripe or Coinbase) in the device browser. The app never sees card numbers.

| Data | Where it comes from in the app | Required? |
|---|---|---|
| Name | Registration, profile | Required |
| Email address | Registration, login, RSVPs, donations | Required |
| Phone numbers | Registration and profile (mobile and alternate), RSVPs, transcript requests | Mobile number required at sign-up |
| Physical address | Residential address, city, region, country (profile) | Optional |
| Photos | Profile photo (picked from the library, uploaded to Cloudinary) | Optional |
| User ID | Account ID issued by the API, stored in the session | Required |
| Other user content | Forum posts and comments, job applications (cover letter), mentorship messages, contact and transcript requests, content reports and member blocks | Optional |
| Purchase history | Dues and donation records (amount, reference, channel) | Optional |
| Other profile data | Date of birth, gender, marital status, year group, programme, house, employment, expertise, emergency contact and next of kin, volunteering preferences | Optional |
| Consents | Terms accepted, 18+ confirmed, directory and news-email opt-ins (with timestamps) | Required (terms, 18+) |

On the device: the access and refresh tokens are kept in the iOS Keychain or
Android Keystore (expo-secure-store). A cached copy of the member profile, the
theme preference and dismissed announcement IDs sit in app storage. Android
`allowBackup` is `false`.

Service providers that process data for UPOSA, which does not count as
"sharing" in either store's definition: Render (API hosting), MongoDB (database),
Cloudinary (photos), Resend (email), and Paystack, Stripe and Coinbase Commerce
(payments, entered by the member on the provider's page).

## 4. Google Play — Data safety form

- **Does your app collect or share any of the required user data types?** Yes.
- **Is all user data encrypted in transit?** Yes (HTTPS only in release builds).
- **Do you provide a way for users to request that their data is deleted?** Yes:
  in-app (Settings → Privacy & data) and at https://www.uposa.org/account-deletion.
- **Data shared with third parties:** None. The processors above are service providers.

For each collected type below, answer: **Collected = Yes, Shared = No,
Processed ephemerally = No, Required or optional** as shown in section 3,
**Purpose = App functionality and Account management**. Email address also gets
**Developer communications**, because news emails are opt-in.

| Play category | Data type |
|---|---|
| Personal info | Name; Email address; Phone number; Address; User IDs; Other info (date of birth, gender, marital status, school and employment details) |
| Financial info | Purchase history (dues and donation records). Do **not** tick "Payment info": the app never handles card details. |
| Photos and videos | Photos (profile photo) |
| App activity | Other user-generated content (forum posts, comments, messages, applications) |

Everything else stays **No**: location, contacts, calendar, messages (SMS/email
content), audio, health, files and docs, web browsing, app info and performance,
and device or other IDs.

## 5. Apple App Store — App Privacy ("nutrition label")

- **Do you or your third-party partners collect data from this app?** Yes.
- **Tracking:** No (the manifest sets `NSPrivacyTracking` to false; there are no tracking domains).

Under **Data Linked to You**, declare the following. None of them is used for tracking.

| Apple category | Data type | Purposes |
|---|---|---|
| Contact Info | Name | App Functionality |
| Contact Info | Email Address | App Functionality; Developer's Advertising or Marketing (opt-in news emails) |
| Contact Info | Phone Number | App Functionality |
| Contact Info | Physical Address | App Functionality |
| User Content | Photos or Videos | App Functionality |
| User Content | Other User Content | App Functionality |
| Identifiers | User ID | App Functionality |
| Purchases | Purchase History | App Functionality |
| Other Data | Other Data Types (profile details) | App Functionality |

Leave **Data Not Linked to You** empty. These answers match
`expo.ios.privacyManifests` in `apps/mobile/app.json`. That manifest also
declares the required-reason APIs:

| API category | Reason |
|---|---|
| UserDefaults | CA92.1 |
| File timestamp | C617.1 |
| System boot time | 35F9.1 |

## 6. Permissions and why

| Platform | Permission | Why |
|---|---|---|
| iOS | Photo library (`NSPhotoLibraryUsageDescription`) | Only when the member picks a new profile photo; only that photo is uploaded. |
| iOS | Camera, microphone, Face ID | Not requested. The config plugins are set to `false`, so no purpose strings ship. |
| iOS | Encryption | `ITSAppUsesNonExemptEncryption: false` (HTTPS only), so answer **No** to export compliance. |
| Android | `INTERNET` | API access. |
| Android | `VIBRATE` | Haptic feedback. |
| Android | Media and storage | Not requested. The profile photo uses the system Photo Picker. `blockedPermissions` strips `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`, `READ_MEDIA_VISUAL_USER_SELECTED`, `READ/WRITE_EXTERNAL_STORAGE`, `RECORD_AUDIO`, `CAMERA` and `SYSTEM_ALERT_WINDOW`, so answer "No" to the Play photo and video permissions declaration. |

## 7. Content rating, audience and App Review notes

**Target audience:** adults only. UPOSA is the old students' association of
University Practice; registration requires confirming you are **18 or older**.

- **Google Play:** target age group 18 and over; the app is not designed for children.
- **Apple:** age rating questionnaire. No objectionable content is provided by
  the developer, but **user-generated content** exists (forum).

**Content rating (IARC / Apple):** no violence, sexual content, gambling, drugs
or profanity is provided by the developer.

- Users can interact and exchange content (forum posts and comments, mentorship messages).
- No location sharing, and no unrestricted web browser inside the app.
- Expect a rating of Teen or 12+ purely because of user interaction.

### User-generated content moderation (Apple 1.2 / Google Play UGC policy)

Members create forum posts and comments, job adverts (web portal) and member
profiles. Both apps and the API provide all four safeguards Apple 1.2 asks for.

| Safeguard | How it works | Where |
|---|---|---|
| **Filter objectionable content** | Forum posts, comments and job adverts (create and edit) are checked server-side. Posts with offensive language are rejected with "Please remove offensive language before posting.", shown inline on the form. | API content filter |
| **Report** | **⋯ → Report** on every forum post, comment, job advert and member profile. Not shown on your own content. Plain-language reasons: spam or scam, harassment, hate, sexual content, violence or threats, false or misleading, something else. Optional details. Confirmation: "Thanks. Our moderators will review this within 24 hours." | Mobile: ⋯ button, or long-press a comment. Web: ⋯ menu. |
| **Block** | **⋯ → Block \<name\>** on posts, comments and profiles, after a confirmation. The blocked member's posts, comments and jobs disappear for the blocker immediately, and they no longer appear in the blocker's directory. | Unblock in **Settings → Privacy & data → Blocked members** |
| **Act on reports** | Moderators review reports in the admin dashboard within **24 hours**. They can hide or delete the content, or suspend the account. Forum posts and comments reported by **3 different members are hidden automatically** until reviewed. Job adverts are already admin-approved before they appear. | Admin dashboard |
| **Published policy** | The Terms of Use state zero tolerance for objectionable content and abusive members (https://www.uposa.org/terms#conduct). Every member accepts them at registration. | Registration, Terms |

Before submitting, make sure someone is actually assigned to clear the reports
queue every day. The 24-hour commitment is in the Terms and in the in-app
confirmation.

**App Review notes** (paste into App Store Connect and adapt for Play "App access"):

> UPOSA Alumni is the members' app of the University Practice Old Students'
> Association (Ghana), a real-world alumni association. Membership is limited to
> adult former students and accounts are approved by the association.
>
> **Dues:** annual membership dues for this real-world association, not digital
> content or features. Members pay online (Paystack/Stripe) or by mobile money
> or bank transfer and record the reference. Paying dues unlocks nothing in the app.
>
> **Donations:** voluntary gifts to the association's school projects. The app
> does not take donations in-app: tapping "Donate" opens the payment page in
> the device's web browser (outside the app), and the record updates when the
> payment provider confirms it.
>
> **Demo account:** email `REPLACE_ME@uposa.org` / password `REPLACE_ME`. This
> must be an approved member account with sample dues, events and forum posts.
>
> **Account deletion:** Settings → Privacy & data → Delete account.
>
> **User-generated content:** members can post in a forum, comment, and (on
> the web portal) advertise jobs.
>
> - Posts and comments containing offensive language are rejected when posted.
> - Any post, comment, job or member can be reported from its ⋯ menu (or by
>   long-pressing a comment).
> - Members can block another member from a post, comment or profile. That
>   hides the blocked member's content and removes them from the blocker's
>   directory; unblock is under Settings → Privacy & data.
> - Moderators review every report within 24 hours. Forum content reported by
>   three members is hidden automatically until reviewed.
> - The Terms of Use, accepted at sign-up, state zero tolerance for
>   objectionable content and abusive users.
>
> To try it with the demo account: open Forum, open any post by another member
> and tap ⋯ (top right of the post, or on a comment).

Do not change the payment flow to an in-app WebView or SFSafariViewController.
Dues and donation checkout must stay on `Linking.openURL` (external browser),
as in `app/dues/index.tsx` and `app/donations/index.tsx`, for guidelines 3.1.1,
3.1.3 and 3.2.1(vi).

### 7a. Google Play — user-generated content answers

In Play Console → Policy → App content, and in the content rating
questionnaire:

| Question | Answer |
|---|---|
| Does the app contain or allow user-generated content? | **Yes**: forum posts and comments, job adverts, member profiles. |
| Users can interact or exchange content? | **Yes** (forum, mentorship messages). No user-to-user payments, no location sharing. |
| Terms that prohibit objectionable content | Yes: https://www.uposa.org/terms#conduct. Members accept them at sign-up. |
| In-app reporting of objectionable content and users | Yes: ⋯ → Report on posts, comments, jobs and profiles. |
| In-app blocking of users | Yes: ⋯ → Block on posts, comments and profiles; manage under Settings → Privacy & data. |
| Moderation | Server-side offensive-language filter on posting. Reports reviewed by moderators within 24 hours. Forum content with 3 reports auto-hidden pending review. Content removal and account suspension from the admin dashboard. |
| Is UGC the primary purpose of the app? | No. It is an association members' app (dues, events, directory, news), and the forum is one feature. |

## 8. Ghana Data Protection Act, 2012 (Act 843): actions the code cannot do

The app and API already provide:

- Separate, explicit consent at sign-up (terms, 18+, optional directory and news opt-ins, all off by default).
- Consent changes in Settings.
- A full data export (right of access).
- Account deletion that anonymises the member. Dues, donation and payment records are kept for the association's accounts, without personal details.

UPOSA itself still needs to:

1. **Register with the Data Protection Commission** as a data controller before processing personal data, and renew the registration when it lapses (Act 843, section 27; https://dataprotection.org.gh).
2. **Appoint a Data Protection Supervisor** (section 58) and name a privacy contact in the Privacy Policy.
3. **Keep a record of processing:**
   - what is collected and why;
   - where it is stored, including the overseas processors listed in section 3;
   - who can access it (admin roles);
   - how long it is kept;
   - how security incidents are handled.
4. **Have a breach procedure.** Notify the Commission and affected members of
   security compromises as soon as reasonably practicable (section 31).
5. **Answer access, correction and deletion requests** that arrive outside the
   app (email or letter) within the statutory time limits, and log them.
6. **Review the Privacy Policy and Terms** at https://www.uposa.org/privacy and
   /terms so they match section 3 of this document, including the international
   transfers to the service providers.

## 9. EAS build and submit checklist

1. Install and sign in: `npm i -g eas-cli`, then `eas login` with the UPOSA Expo account.
2. In `apps/mobile`, run `eas init` once. It writes `extra.eas.projectId` into `app.json`; commit that.
3. Fill in the `REPLACE_ME` placeholders in `eas.json` under `submit.production`:
   - **iOS:** `appleId`, `ascAppId` and `appleTeamId`.
   - **Android:** `serviceAccountKeyPath`. Keep that key file out of git; `*service-account*.json` is already ignored.
4. Run `npx expo-doctor` and `npx tsc --noEmit` in `apps/mobile`; both must be clean.
5. Build both platforms with the production profile:
   - `eas build --platform ios --profile production`
   - `eas build --platform android --profile production`
   - Let EAS manage credentials (distribution certificate and upload keystore).
6. Smoke-test the build from the `preview` profile on real devices:
   - registration consents, login links and profile photo pick;
   - dues and donation checkout opening the external browser;
   - Settings → Privacy & data: toggles, data download and delete with a test account.
7. Submit:
   - `eas submit --platform ios --profile production --latest`
   - `eas submit --platform android --profile production --latest` (goes to the internal track as a draft)
8. **App Store Connect:**
   - App Privacy answers (section 5), age rating (section 7), export compliance "No";
   - privacy policy, support and marketing URLs;
   - screenshots;
   - App Review notes with a working demo account.
9. **Play Console:**
   - Data safety (section 4), content rating questionnaire, target audience 18+;
   - App access (demo credentials), Ads: "No ads", Financial features: none;
   - User-generated content (Policy → App content): answer as in section 7a;
   - Delete account URL;
   - Photo and video permissions: not used.
10. Promote the Android release from internal to production after review.
