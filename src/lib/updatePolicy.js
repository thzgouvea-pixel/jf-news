export const UPDATE_MODES = {
  IDLE: "idle",
  DRAW_PENDING: "draw_pending",
  PREMATCH: "prematch",
  LIVE: "live",
  POSTMATCH: "postmatch",
  RANKING_DAY: "ranking_day",
};

export const TTLS = {
  live: 30,
  nextMatchIdle: 60 * 60 * 2,
  nextMatchDrawPending: 60 * 60,
  nextMatchPrematch: 60 * 15,
  nextMatchUrgent: 60 * 10,
  newsIdle: 60 * 60 * 4,
  newsTournament: 60 * 60,
  newsMatchday: 60 * 30,
  oddsTournament: 60 * 60,
  oddsPrematch: 60 * 30,
  opponentProfile: 60 * 60 * 24 * 3,
  tournamentFacts: 60 * 60 * 24 * 14,
  biographyBase: 60 * 60 * 24 * 14,
  biographyEditorial: 60 * 60 * 24,
  rankingWeekly: 60 * 60 * 24 * 7,
  seasonStats: 60 * 60 * 24,
  postMatchHotWindowMinutes: 60 * 6,
};

export function getMatchContext(nextMatch, liveMatch, now = new Date()) {
  const nowTs = now.getTime();
  const isMonday = now.getDay() === 1;
  const isLive = !!(liveMatch && liveMatch.live);
  const nextDate = nextMatch?.date ? new Date(nextMatch.date) : null;
  const nextTs = nextDate && !Number.isNaN(nextDate.getTime()) ? nextDate.getTime() : null;
  const minutesToMatch = nextTs ? Math.round((nextTs - nowTs) / 60000) : null;
  const hasDefinedOpponent = !!(nextMatch?.opponent_name && nextMatch.opponent_name !== "A definir");
  const hasTournament = !!nextMatch?.tournament_name;
  const hasScheduledMatch = !!nextTs;
  const in48h = minutesToMatch !== null && minutesToMatch <= 60 * 48 && minutesToMatch > 0;
  const in24h = minutesToMatch !== null && minutesToMatch <= 60 * 24 && minutesToMatch > 0;
  const in4h = minutesToMatch !== null && minutesToMatch <= 60 * 4 && minutesToMatch > 0;

  return {
    isMonday,
    isLive,
    hasDefinedOpponent,
    hasTournament,
    hasScheduledMatch,
    nextDate,
    minutesToMatch,
    in48h,
    in24h,
    in4h,
  };
}

export function detectUpdateMode({ nextMatch, liveMatch, lastMatch }, now = new Date()) {
  const ctx = getMatchContext(nextMatch, liveMatch, now);

  if (ctx.isLive) return UPDATE_MODES.LIVE;

  const lastDate = lastMatch?.date ? new Date(lastMatch.date) : null;
  const minutesSinceLastMatch = lastDate && !Number.isNaN(lastDate.getTime())
    ? Math.round((now.getTime() - lastDate.getTime()) / 60000)
    : null;

  if (minutesSinceLastMatch !== null && minutesSinceLastMatch >= 0 && minutesSinceLastMatch <= TTLS.postMatchHotWindowMinutes) {
    return UPDATE_MODES.POSTMATCH;
  }

  if (ctx.isMonday && !ctx.in24h && !ctx.isLive) return UPDATE_MODES.RANKING_DAY;

  if (ctx.hasTournament && (!ctx.hasDefinedOpponent || !ctx.hasScheduledMatch)) {
    return UPDATE_MODES.DRAW_PENDING;
  }

  if (ctx.in24h || ctx.in48h) {
    return UPDATE_MODES.PREMATCH;
  }

  return UPDATE_MODES.IDLE;
}

export function getRefreshPolicy(mode, context = {}) {
  const urgentPrematch = !!context.in4h;

  switch (mode) {
    case UPDATE_MODES.LIVE:
      return {
        mode,
        coreMatchTtl: TTLS.live,
        newsTtl: TTLS.newsMatchday,
        oddsTtl: TTLS.oddsPrematch,
        rankingTtl: TTLS.rankingWeekly,
        biographyBaseTtl: TTLS.biographyBase,
        biographyEditorialTtl: TTLS.biographyEditorial,
        notes: [
          "Only live score/status should poll aggressively.",
          "Do not recompute biography, rankings, tournament facts, or opponent profile during live mode.",
        ],
      };

    case UPDATE_MODES.POSTMATCH:
      return {
        mode,
        coreMatchTtl: 60 * 10,
        newsTtl: TTLS.newsMatchday,
        oddsTtl: TTLS.oddsTournament,
        rankingTtl: TTLS.rankingWeekly,
        biographyBaseTtl: TTLS.biographyBase,
        biographyEditorialTtl: 60 * 60 * 6,
        notes: [
          "Refresh last match, recent form, season W-L, and editorial biography after result.",
          "Keep expensive enrichments off unless a milestone happened.",
        ],
      };

    case UPDATE_MODES.RANKING_DAY:
      return {
        mode,
        coreMatchTtl: TTLS.nextMatchIdle,
        newsTtl: TTLS.newsIdle,
        oddsTtl: TTLS.oddsTournament,
        rankingTtl: 60 * 60 * 2,
        biographyBaseTtl: TTLS.biographyBase,
        biographyEditorialTtl: TTLS.biographyEditorial,
        notes: [
          "Prioritize ATP ranking refreshes on Monday.",
          "Do not spend aggressively on pre-match enrichments unless a match is close.",
        ],
      };

    case UPDATE_MODES.DRAW_PENDING:
      return {
        mode,
        coreMatchTtl: TTLS.nextMatchDrawPending,
        newsTtl: TTLS.newsTournament,
        oddsTtl: TTLS.oddsTournament,
        rankingTtl: TTLS.rankingWeekly,
        biographyBaseTtl: TTLS.biographyBase,
        biographyEditorialTtl: TTLS.biographyEditorial,
        notes: [
          "Tournament is active, but opponent and/or order of play are not fully confirmed.",
          "Avoid AI enrichment loops while official scheduling is still incomplete.",
        ],
      };

    case UPDATE_MODES.PREMATCH:
      return {
        mode,
        coreMatchTtl: urgentPrematch ? TTLS.nextMatchUrgent : TTLS.nextMatchPrematch,
        newsTtl: TTLS.newsMatchday,
        oddsTtl: TTLS.oddsPrematch,
        rankingTtl: TTLS.rankingWeekly,
        biographyBaseTtl: TTLS.biographyBase,
        biographyEditorialTtl: TTLS.biographyEditorial,
        notes: [
          "Increase frequency only for match-state and order-of-play information.",
          "Opponent profile and tournament facts should come from cache unless opponent changes.",
        ],
      };

    case UPDATE_MODES.IDLE:
    default:
      return {
        mode: UPDATE_MODES.IDLE,
        coreMatchTtl: TTLS.nextMatchIdle,
        newsTtl: TTLS.newsIdle,
        oddsTtl: TTLS.oddsTournament,
        rankingTtl: TTLS.rankingWeekly,
        biographyBaseTtl: TTLS.biographyBase,
        biographyEditorialTtl: TTLS.biographyEditorial,
        notes: [
          "No close match window detected.",
          "Prefer cheap refreshes and long-lived cache entries.",
        ],
      };
  }
}

export function shouldRefresh(updatedAt, ttlSeconds, now = Date.now()) {
  if (!updatedAt) return true;
  const ts = new Date(updatedAt).getTime();
  if (Number.isNaN(ts)) return true;
  return now - ts >= ttlSeconds * 1000;
}
