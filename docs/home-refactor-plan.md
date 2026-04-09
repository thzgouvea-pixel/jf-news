# Home Refactor Plan

## Goal
Reduce the size and coupling of `src/pages/index.jsx` without changing the visual identity or the main product behavior.

## What was extracted first
- `src/hooks/useCountdown.js`
- `src/lib/formatters.js`
- `src/data/playerDb.js`
- `src/data/countryFlags.js`

These modules are safe extractions because they are stateless or low-risk and can be imported incrementally.

## Recommended next extractions
1. `src/components/home/NextDuelCard.jsx`
2. `src/components/home/PlayerBlock.jsx`
3. `src/components/home/MatchCarousel.jsx`
4. `src/components/home/NewsCard.jsx`
5. `src/components/ui/Modal.jsx`

## Recommended hooks after that
- `useHomeData`
- `useInstallPrompt`
- `usePushNotifications`
- `useLiveMatch`

## Why this order
This keeps the site stable while removing duplicated logic and lowering the amount of state and helper code kept inside the page file.

## Main risk areas to protect during refactor
- live score polling
- push notification opt-in flow
- install / PWA prompts
- localStorage vote and prediction state
- fallback sample data rendering
- mobile tab bar visibility rules
