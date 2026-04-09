# Homepage redesign spec

## Goal
Redesign the homepage without losing information density.
The duel card remains the core product block and must preserve all useful details while improving readability, hierarchy, and consistency.

## Principles
- Do not remove important information from the duel card.
- Reorganize information into clearer visual layers.
- Keep mobile as the primary experience.
- Separate urgent-now information from complementary context.
- Preserve editorial depth without making the top of the page feel crowded.

## New homepage hierarchy

### Layer 1 — urgent now
- Duel / live card
- Match status
- Watch CTA
- Date, time, court, countdown

### Layer 2 — what just happened
- Last match
- Highlights
- Recent form

### Layer 3 — what changed today
- News feed
- João em números
- Ranking-facing updates

### Layer 4 — 360º exploration
- Calendar
- Titles
- Timeline
- Comparators
- Quiz / poll / extras

## Duel card content to preserve
- Opponent name
- Tournament name
- Category
- Round
- Surface
- Date
- Time
- Countdown
- Court / stadium
- Broadcast information
- Probability bar
- Calendar CTA
- Watch CTA
- Opponent quick access
- Live state details when applicable
- Tournament facts / rotating contextual note

## Duel card visual structure

### A. Context bar
- Status (`AO VIVO` or `PRÓXIMO DUELO`)
- Round
- Category
- Surface

### B. Player confrontation block
- João avatar
- Opponent avatar
- Player names
- Flags / rankings beneath names
- Live serving indicator when applicable

### C. Practical match grid
- Date
- Time
- Court / stadium
- Broadcast

### D. Countdown strip
- Time remaining until match starts
- Separate from the practical grid to improve scanability

### E. Actions row
- Primary: watch
- Secondary: add to calendar
- Tertiary/contextual: open opponent profile

### F. Probability module
- Two percentages
- Horizontal bar
- Small, clean label

### G. Contextual fact strip
- Rotating tournament or match fact
- Low visual weight

## State-specific behavior

### Prematch
Emphasize:
- date/time
- countdown
- court
- broadcast
- round

### Draw pending
Emphasize:
- tournament context
- possible next round
- avoid pretending official scheduling is known

### Live
Emphasize:
- score
- set count
- current status
- serving indicator
- watch live CTA

### Postmatch
Emphasize:
- result
- score
- next scenario or next match when known

## First implementation scope
1. Create a new duel card component focused on visual hierarchy.
2. Keep all existing duel data points supported.
3. Integrate the new duel card into a preview route first.
4. Only after validating the preview, migrate the production homepage.
