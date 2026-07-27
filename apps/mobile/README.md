# UPOSA Alumni — Mobile

The UPOSA Alumni mobile app, built with **Expo SDK 56** (React Native 0.86) and **expo-router** file-based routing. It mirrors the feature set of the alumni web app (`apps/alumni`) in the same monorepo.

## Stack

- Expo SDK 56 + expo-router (typed, file-based routes under `app/`)
- React Native 0.86, plain `StyleSheet` (no CSS framework)
- Zustand auth store (`lib/auth-store.ts`)
- Centralised API client (`lib/api.ts`) + typed models (`lib/types.ts`)
- Shared design system: `components/mobile-ui.tsx`, theme tokens in `constants/theme.ts` (Fraunces / Euclid Circular A / Outfit, light + dark palettes)

## Develop

From the repo root:

```bash
npm run dev:mobile
```

Or from this directory:

```bash
npx expo start
```

The API base URL is configured via the `EXPO_PUBLIC_API_URL` environment variable (see the repo-root `production.env` / Render config for deployed values).

## Features

- Auth: sign in / register, profile management, photo upload
- Members directory
- Events (upcoming/past) with RSVP
- News articles with markdown content
- Dues & payments (pay dues, payment methods, history)
- Forum discussions, polls, and elections
- Jobs board and mentorship (requests, mentees, availability)
- Donations and projects (funding progress, milestones, markdown content)
- Transcripts, gallery, and contact
- Site content driven by the public `siteData` endpoint

## Conventions

- Screens follow the shared idioms: `ScreenScroll`/`FlatList` + `RefreshControl`, `LoadingState` on first load, `EmptyState`, `Alert.alert` with the server error `message`.
- Palette comes from `useColorScheme()` + `Colors[scheme]`; every screen supports light and dark. Never hardcode hex colors outside `Brand` constants.
- Long-form content is rendered with `react-native-markdown-display` via `components/markdown.tsx`.
