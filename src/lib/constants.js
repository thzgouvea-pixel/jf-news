// ===== FONSECA NEWS — DESIGN SYSTEM (single source of truth) =====
// Any page/component should import from here — never redeclare locally.
// Re-declaring constants locally causes drift between pages (e.g. #1a1a1a vs #111827).
//
// Palette: Tailwind CSS neutral scale (2024 industry standard).
// Contrast-audited for WCAG AA compliance on white backgrounds.

// ===== BRAND =====
export const GREEN = "#00A859";   // Brazil green — primary brand
export const YELLOW = "#FFCB05";  // Brazil yellow — accent

// ===== TEXT (Tailwind neutral) =====
export const TEXT = "#111827";    // gray-900 — main text
export const SUB = "#4B5563";     // gray-600 — secondary text
export const DIM = "#9CA3AF";     // gray-400 — tertiary/hints
export const BORDER = "#E5E7EB";  // gray-200 — default borders
export const BG_ALT = "#FAFBFC";  // subtle surface background

// ===== SEMANTIC =====
export const RED = "#DC2626";     // red-600 — errors, losses, negative states

// ===== FONTS =====
export const SERIF = "'Source Serif 4', Georgia, serif";
export const SANS = "'Inter', -apple-system, sans-serif";

// ===== TYPOGRAPHY SCALE =====
// 8-step scale. Use these instead of arbitrary sizes going forward.
// (Existing inline usages stay as-is until the "consolidate typography" refactor.)
export const FS = {
  xxs: 10,      // micro labels, badge caps (use sparingly)
  xs: 12,       // meta text, timestamps
  sm: 13,       // small body
  base: 14,     // body default
  md: 16,       // emphasized body
  lg: 18,       // subtitles
  xl: 22,       // h3, section titles
  xxl: 28,      // h2, card titles
  display: 36,  // h1, hero
};

// Font weights — 3 values. Stick to these.
export const FW = {
  regular: 400,
  medium: 600,
  bold: 800,
};

// ===== LAYOUT =====
// Border radius — 5 values covering all legit UI needs
export const RADIUS = {
  sm: 6,        // tags, inline pills
  md: 8,        // inputs, small buttons
  lg: 12,       // small cards
  xl: 18,       // large cards (main content blocks)
  pill: 9999,
};

// Legacy alias — prefer RADIUS.xl going forward
export const CARD_RADIUS = 18;

// ===== SHADOWS =====
// Slightly stronger than v1 (0.04/0.03) for visibility on lower-contrast monitors
export const CARD_SHADOW = "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)";
export const CARD_SHADOW_MD = "0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.05)";

// ===== CACHE =====
export const CACHE_DURATION_MS = 5 * 60 * 1000;

// ===== MAPS =====
export const surfaceColorMap = {
  "Saibro": "#E8734A", "Clay": "#E8734A",
  "Hard": "#3B82F6", "Duro": "#3B82F6", "Piso duro": "#3B82F6", "Dura": "#3B82F6",
  "Grama": "#22C55E", "Grass": "#22C55E"
};

export const catColors = {
  "Torneio": "#c0392b", "Treino": "#2A9D8F", "Declaração": "#b8860b",
  "Resultado": "#2563EB", "Ranking": "#6D35D0", "Notícia": "#6b6b6b",
};

export const countryFlags = {
  "Spain": "🇪🇸", "France": "🇫🇷", "Italy": "🇮🇹", "USA": "🇺🇸", "United States": "🇺🇸",
  "Germany": "🇩🇪", "UK": "🇬🇧", "United Kingdom": "🇬🇧", "Australia": "🇦🇺",
  "Argentina": "🇦🇷", "Serbia": "🇷🇸", "Russia": "🇷🇺", "Greece": "🇬🇷",
  "Canada": "🇨🇦", "Norway": "🇳🇴", "Denmark": "🇩🇰", "Poland": "🇵🇱",
  "Chile": "🇨🇱", "Japan": "🇯🇵", "China": "🇨🇳", "Czech Republic": "🇨🇿",
  "Czechia": "🇨🇿", "Bulgaria": "🇧🇬", "Belgium": "🇧🇪", "Netherlands": "🇳🇱",
  "Switzerland": "🇨🇭", "Croatia": "🇭🇷", "Brazil": "🇧🇷", "Portugal": "🇵🇹",
  "Colombia": "🇨🇴", "Mexico": "🇲🇽", "Peru": "🇵🇪", "South Korea": "🇰🇷",
  "Taiwan": "🇹🇼", "Austria": "🇦🇹", "Hungary": "🇭🇺", "Romania": "🇷🇴",
  "Sweden": "🇸🇪", "Finland": "🇫🇮", "Kazakhstan": "🇰🇿", "Georgia": "🇬🇪",
  "Tunisia": "🇹🇳", "Monaco": "🇲🇨", "Mônaco": "🇲🇨",
  "Morocco": "🇲🇦", "Slovakia": "🇸🇰", "New Zealand": "🇳🇿",
  "India": "🇮🇳", "Uruguay": "🇺🇾", "Ecuador": "🇪🇨",
  "Bolivia": "🇧🇴", "Thailand": "🇹🇭", "Belarus": "🇧🇾",
  "Ukraine": "🇺🇦", "Turkey": "🇹🇷", "Türkiye": "🇹🇷",
  "South Africa": "🇿🇦", "Israel": "🇮🇱", "Ireland": "🇮🇪",
  "Great Britain": "🇬🇧", "Slovenia": "🇸🇮", "Lithuania": "🇱🇹",
  "Latvia": "🇱🇻", "Estonia": "🇪🇪", "Bosnia and Herzegovina": "🇧🇦",
  "Bosnia": "🇧🇦", "Chinese Taipei": "🇹🇼", "Uzbekistan": "🇺🇿",
  "Egypt": "🇪🇬", "Algeria": "🇩🇿",
};

export const PLAYER_DB = {
  "Alcaraz": { slug: "a0e2", espn: "4686", sofa: 856498 },
  "Sinner": { slug: "s0ag", espn: "4375", sofa: 333849 },
  "Djokovic": { slug: "d643", espn: "777", sofa: 12708 },
  "Medvedev": { slug: "mm58", espn: "3367", sofa: 196065 },
  "Zverev": { slug: "z355", espn: "3098", sofa: 197075 },
  "Rublev": { slug: "re44", espn: "3523", sofa: 197592 },
  "Ruud": { slug: "rh16", espn: null, sofa: null },
  "Tsitsipas": { slug: "te51", espn: null, sofa: null },
  "Fritz": { slug: "fb98", espn: "2981", sofa: 163713 },
  "Rune": { slug: "r0dg", espn: "4685", sofa: null },
  "Hurkacz": { slug: "hb71", espn: "3264", sofa: 203766 },
  "Khachanov": { slug: "ke29", espn: "3112", sofa: null },
  "Berrettini": { slug: "bk40", espn: "3316", sofa: 205641 },
  "Diallo": { slug: "d0f6", espn: "3885", sofa: 280151 },
  "Shelton": { slug: "s0s1", espn: "11712", sofa: 963814 },
  "Draper": { slug: "d0bi", espn: "4580", sofa: 366258 },
  "Tiafoe": { slug: "td51", espn: "3263", sofa: 235141 },
  "Musetti": { slug: "m0ej", espn: "4228", sofa: 367702 },
  "Fils": { slug: "f0gx", espn: "11716", sofa: 963839 },
  "Cerundolo": { slug: "c0aq", espn: "11689", sofa: 829780 },
  "Davidovich Fokina": { slug: "d0au", espn: "4579", sofa: 367748 },
  "Auger-Aliassime": { slug: "ag37", espn: "3270", sofa: 230882 },
  "de Minaur": { slug: "dh58", espn: "3313", sofa: 226413 },
  "Paul": { slug: "pl56", espn: "3117", sofa: 189458 },
  "Tabilo": { slug: "t0ag", espn: "4684", sofa: 367700 },
  "Machac": { slug: "m0eo", espn: "11709", sofa: 828775 },
  "Mpetshi Perricard": { slug: "m0je", espn: "11747", sofa: null },
  "Mensik": { slug: "m0ij", espn: "11746", sofa: 979825 },
  "Shapovalov": { slug: "su55", espn: "3086", sofa: 202233 },
  "Munar": { slug: "mf53", espn: "4229", sofa: 252456 },
  "Rinderknech": { slug: "rc91", espn: "3511", sofa: 136498 },
  "Fonseca": { slug: "f0fv", espn: "11745", sofa: null },
  "Nakashima": { slug: "n0ae", espn: "4581", sofa: 829749 },
  "Baez": { slug: "b0dx", espn: "11690", sofa: 830192 },
  "Etcheverry": { slug: "e0gd", espn: "11700", sofa: 953250 },
  "Jarry": { slug: "j0ag", espn: "3539", sofa: 135133 },
  "Bublik": { slug: "b0bk", espn: "3540", sofa: 227296 },
  "Kokkinakis": { slug: "k0ad", espn: "3124", sofa: null },
  "Korda": { slug: "k0ah", espn: "4578", sofa: 367699 },
  "Norrie": { slug: "n0ab", espn: "3266", sofa: null },
  "Dimitrov": { slug: "d875", espn: "1629", sofa: 26696 },
  "Monfils": { slug: "m788", espn: "716", sofa: 14640 },
  "Wawrinka": { slug: "w367", espn: "536", sofa: null },
  "Nishikori": { slug: "n552", espn: "1058", sofa: null },
  "Coric": { slug: "c0ag", espn: "2435", sofa: null },
  "Popyrin": { slug: "p0dj", espn: "3541", sofa: null },
  "Thompson": { slug: "t0aj", espn: "3099", sofa: null },
  "Giron": { slug: "g0ah", espn: "3116", sofa: null },
  "Kotov": { slug: null, espn: "11706", sofa: null },
  "Safiullin": { slug: null, espn: "11714", sofa: null },
};

export const FONSECA_IMG = "https://www.atptour.com/-/media/alias/player-headshot/f0fv";
export const FONSECA_IMG_FALLBACK = "https://a.espncdn.com/combiner/i?img=/i/headshots/tennis/players/full/11745.png&w=200&h=145";
