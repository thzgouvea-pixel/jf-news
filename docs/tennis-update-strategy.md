# Tennis-aware freshness strategy

This document defines how Fonseca News should stay current without burning budget.

## Core principle
Do not refresh the whole site at a single cadence.
Refresh each information block according to:
1. how fast that information naturally changes in tennis
2. where João is in the competitive cycle
3. whether the site is in a match-adjacent window

## Competitive modes

### 1. idle
Use when there is no live match and no scheduled match in the next 48 hours.

Focus:
- cheap updates only
- long cache windows
- no aggressive opponent enrichment

### 2. draw_pending
Use when a tournament is active but the next opponent and/or order of play is still incomplete.

Focus:
- refresh next-match state more often than idle
- do not burn AI calls trying to guess missing official scheduling too early
- fetch opponent profile only after opponent is defined

### 3. prematch
Use when a match is scheduled in the next 48 hours.

Focus:
- next-match and order-of-play become the top priority
- tighten cache windows as match time approaches
- odds can refresh more often only when opponent is confirmed

### 4. live
Use only while the match is live.

Focus:
- live score and live status
- no biography/ranking/tournament-facts recomputation
- keep the expensive work off during live mode

### 5. postmatch
Use in the first hours after a match finishes.

Focus:
- last match
- recent form
- season W-L
- João em números
- editorial biography updates if there was a milestone

### 6. ranking_day
Use on Monday when ATP rankings refresh.

Focus:
- ranking changes
- best ranking updates
- ranking-facing UI
- do not spend aggressively elsewhere unless there is also a close match

## Recommended refresh ownership by block

### A. match state
Includes:
- next opponent
- date/time
- court
- round
- live status
- last match detection

Owner job:
- `core-match`

### B. news
Includes:
- news feed
- headlines
- summaries

Owner job:
- `news-refresh`

### C. stats and numbers
Includes:
- recent form
- season stats
- João em números
- career increments after new results

Owner job:
- `post-match-recalc`

### D. slow data
Includes:
- ATP ranking
- biography base
- opponent profile
- tournament facts

Owner job:
- `slow-refresh`

## Suggested TTLs

- live: 30s
- next match idle: 2h
- next match draw pending: 1h
- next match prematch: 15m
- next match urgent (under 4h): 10m
- news idle: 4h
- news tournament: 1h
- news matchday: 30m
- odds tournament: 1h
- odds prematch: 30m
- opponent profile: 3d
- tournament facts: 14d
- biography base: 14d
- biography editorial: 1d
- ranking weekly: 7d
- season stats: 1d

## Important design rules

### Biography must be split
Use two layers:
- `biography_base`: stable facts like birthplace, hand, height, coach
- `biography_editorial`: dynamic milestone text like title runs, best ranking, finals reached

### Ranking is slow data
Ranking should not be refreshed aggressively outside Monday unless the product explicitly supports projected/live ranking.

### Opponent profile is event-driven
Refresh only when the opponent changes.
Do not repeatedly recompute the same profile during a short tournament window.

### Tournament facts are tournament-scoped
Fetch once per tournament and cache for a long time.

### Expensive AI enrichment must be gated
Only call AI for court/ranking/order-of-play enrichment when:
- there is a confirmed opponent
- the match is close enough to matter
- cache is stale
- official data is still missing

## Immediate implementation roadmap

1. Add a central update policy module
2. Add a diagnostic endpoint that shows the current site mode
3. Split the current monolithic cron responsibilities into:
   - `core-match`
   - `news-refresh`
   - `post-match-recalc`
   - `slow-refresh`
4. Make the heavy jobs respect the policy TTLs
5. Stop recomputing slow data in fast windows

## Goal
Keep the site feeling live for tennis fans while making the refresh cost proportional to the actual volatility of the information.
