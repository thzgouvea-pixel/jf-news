import { SANS, SERIF } from '../lib/constants';

var FLAGS = {
  "Australia": "🇦🇺", "Austrália": "🇦🇺",
  "Argentina": "🇦🇷",
  "Brasil": "🇧🇷", "Brazil": "🇧🇷",
  "EUA": "🇺🇸", "USA": "🇺🇸", "United States": "🇺🇸",
  "Mônaco": "🇲🇨", "Monaco": "🇲🇨",
  "Espanha": "🇪🇸", "Spain": "🇪🇸",
  "Itália": "🇮🇹", "Italy": "🇮🇹",
  "França": "🇫🇷", "France": "🇫🇷",
  "Reino Unido": "🇬🇧", "UK": "🇬🇧", "United Kingdom": "🇬🇧",
  "Alemanha": "🇩🇪", "Germany": "🇩🇪",
  "Canadá": "🇨🇦", "Canada": "🇨🇦",
  "China": "🇨🇳",
  "Áustria": "🇦🇹", "Austria": "🇦🇹",
  "Japão": "🇯🇵", "Japan": "🇯🇵",
  "Suíça": "🇨🇭", "Switzerland": "🇨🇭",
  "Holanda": "🇳🇱", "Netherlands": "🇳🇱",
};

var SURFACE_COLORS = { "Saibro": "#D97706", "Clay": "#D97706", "Duro": "#3B82F6", "Hard": "#3B82F6", "Grama": "#16A34A", "Grass": "#16A34A" };
var SURFACE_PT = { "Clay": "Saibro", "Hard": "Duro", "Grass": "Grama", "Saibro": "Saibro", "Duro": "Duro", "Grama": "Grama" };
var CAT_COLORS = { "Grand Slam": "#6D35D0", "Masters 1000": "#c0392b", "ATP 500": "#2563EB", "ATP 250": "#6b7280", "Finals": "#b8860b" };

var GENERIC_WORDS = ["open", "masters", "grand", "slam", "atp", "finals", "international", "championship", "cup", "classic"];

var FALLBACK = [
  { name: "Australian Open", cat: "Grand Slam", surface: "Duro", city: "Melbourne", country: "Austrália", start: "2026-01-18", end: "2026-02-01" },
  { name: "Rio Open", cat: "ATP 500", surface: "Saibro", city: "Rio de Janeiro", country: "Brasil", start: "2026-02-16", end: "2026-02-22" },
  { name: "Indian Wells Masters", cat: "Masters 1000", surface: "Duro", city: "Indian Wells", country: "EUA", start: "2026-03-09", end: "2026-03-22" },
  { name: "Miami Open", cat: "Masters 1000", surface: "Duro", city: "Miami", country: "EUA", start: "2026-03-23", end: "2026-04-05" },
  { name: "Monte Carlo", cat: "Masters 1000", surface: "Saibro", city: "Monte Carlo", country: "Mônaco", start: "2026-04-05", end: "2026-04-12" },
  { name: "BMW Open", cat: "ATP 500", surface: "Saibro", city: "Munique", country: "Alemanha", start: "2026-04-13", end: "2026-04-19" },
  { name: "Madrid Open", cat: "Masters 1000", surface: "Saibro", city: "Madri", country: "Espanha", start: "2026-04-22", end: "2026-05-03" },
  { name: "Roma Masters", cat: "Masters 1000", surface: "Saibro", city: "Roma", country: "Itália", start: "2026-05-06", end: "2026-05-17" },
  { name: "Roland Garros", cat: "Grand Slam", surface: "Saibro", city: "Paris", country: "França", start: "2026-05-24", end: "2026-06-07" },
  { name: "Wimbledon", cat: "Grand Slam", surface: "Grama", city: "Londres", country: "Reino Unido", start: "2026-06-29", end: "2026-07-12" },
  { name: "US Open", cat: "Grand Slam", surface: "Duro", city: "Nova York", country: "EUA", start: "2026-08-31", end: "2026-09-13" },
  { name: "ATP Finals", cat: "Finals", surface: "Duro", city: "Turim", country: "Itália", start: "2026-11-15", end: "2026-11-22" },
];

function matchesName(calName, tournName) {
  if (!calName || !tournName) return false;
  var a = calName.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  var b = tournName.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  var aWords = a.split(/\s+/).filter(function(w) { return w.length > 2 && GENERIC_WORDS.indexOf(w) === -1; });
  var bWords = b.split(/\s+/).filter(function(w) { return w.length > 2 && GENERIC_WORDS.indexOf(w) === -1; });
  for (var i = 0; i < aWords.length; i++) {
    for (var j = 0; j < bWords.length; j++) {
      if (aWords[i] === bWords[j]) return true;
    }
  }
  return false;
}

function formatDateRange(start, end) {
  if (!start) return "";
  var mShort = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  var sd = new Date(start);
  var ed = end ? new Date(end) : sd;
  var sDay = sd.getUTCDate();
  var sMonth = mShort[sd.getUTCMonth()];
  var eDay = ed.getUTCDate();
  var eMonth = mShort[ed.getUTCMonth()];
  if (sMonth === eMonth) return sDay + " - " + eDay + " " + sMonth;
  return sDay + " " + sMonth + " - " + eDay + " " + eMonth;
}

export default function NextStopCard(props) {
  var nextMatch = props.nextMatch;
  var lastMatch = props.lastMatch;
  var atpCalendar = props.atpCalendar;
  var nextTournament = props.nextTournament;

  // If "Próximo Torneio" card is being shown (no active nextMatch + has nextTournament),
  // hide "Próxima Parada" to avoid redundancy
  var hasActiveNextMatch = !!(nextMatch && nextMatch.opponent_name && nextMatch.opponent_name !== "A definir");
  if (!hasActiveNextMatch && nextTournament) return null;

  var currentTourn = null;
  if (nextMatch && nextMatch.tournament_name) currentTourn = nextMatch.tournament_name;
  else if (lastMatch && lastMatch.tournament_name) currentTourn = lastMatch.tournament_name;
  if (!currentTourn) return null;

  var sorted = FALLBACK.slice().sort(function(a, b) { return (a.start || "").localeCompare(b.start || ""); });

  var currentIdx = -1;
  for (var i = 0; i < sorted.length; i++) {
    if (matchesName(sorted[i].name, currentTourn)) {
      currentIdx = i;
      break;
    }
  }

  if (currentIdx === -1) {
    var now = new Date().toISOString().split("T")[0];
    for (var j = 0; j < sorted.length; j++) {
      if (sorted[j].end && sorted[j].end >= now) {
        currentIdx = j;
        break;
      }
    }
  }

  if (currentIdx === -1) return null;

  // Only show tournaments João is CONFIRMED to play (Grand Slams + Masters 1000)
  var CONFIRMED_CATS = ["Grand Slam", "Masters 1000", "Finals"];
  var next = null;
  for (var k = currentIdx + 1; k < sorted.length; k++) {
    if (CONFIRMED_CATS.indexOf(sorted[k].cat) !== -1) {
      next = sorted[k];
      break;
    }
  }
  if (!next || !next.name) return null;

  var flag = FLAGS[next.country] || FLAGS[next.city] || "";
  var surfacePt = SURFACE_PT[next.surface] || next.surface || "";
  var surfaceColor = SURFACE_COLORS[next.surface] || "#999";
  var catColor = CAT_COLORS[next.cat] || "#6b7280";
  var dateRange = formatDateRange(next.start, next.end);

  return (
    <section style={{ padding: "12px 0 0" }}>
      <div style={{
        borderRadius: 16,
        background: "transparent",
        border: "1px solid #e0e0e0",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "#f5f5f5",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, flexShrink: 0,
        }}>
          {flag || "✈️"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#FFCB05",
              display: "inline-block",
              animation: "pulse 2s ease-in-out infinite",
              boxShadow: "0 0 6px #FFCB0580",
            }} />
            <span style={{
              fontSize: 9, fontWeight: 700, color: "#999",
              fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              Próxima parada
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", fontFamily: SERIF, lineHeight: 1.2 }}>
              {next.name}
            </span>
            <span style={{
              fontSize: 8, fontWeight: 700, color: catColor,
              background: catColor + "14", padding: "2px 7px",
              borderRadius: 99, fontFamily: SANS, whiteSpace: "nowrap",
            }}>
              {next.cat}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#444", fontFamily: SANS }}>
              {dateRange}
            </span>
            <span style={{ fontSize: 10, color: "#ccc" }}>·</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: surfaceColor, fontFamily: SANS }}>
              {surfacePt}
            </span>
            {next.city && (
              <>
                <span style={{ fontSize: 10, color: "#ccc" }}>·</span>
                <span style={{ fontSize: 11, color: "#888", fontFamily: SANS }}>
                  {next.city}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
