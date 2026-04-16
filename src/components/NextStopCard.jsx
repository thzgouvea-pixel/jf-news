import { SANS, SERIF } from '../lib/constants';

var FLAGS = {
  "Australia": "\ud83c\udde6\ud83c\uddfa", "Austr\u00e1lia": "\ud83c\udde6\ud83c\uddfa",
  "Argentina": "\ud83c\udde6\ud83c\uddf7",
  "Brasil": "\ud83c\udde7\ud83c\uddf7", "Brazil": "\ud83c\udde7\ud83c\uddf7",
  "EUA": "\ud83c\uddfa\ud83c\uddf8", "USA": "\ud83c\uddfa\ud83c\uddf8", "United States": "\ud83c\uddfa\ud83c\uddf8",
  "M\u00f4naco": "\ud83c\uddf2\ud83c\udde8", "Monaco": "\ud83c\uddf2\ud83c\udde8",
  "Espanha": "\ud83c\uddea\ud83c\uddf8", "Spain": "\ud83c\uddea\ud83c\uddf8",
  "It\u00e1lia": "\ud83c\uddee\ud83c\uddf9", "Italy": "\ud83c\uddee\ud83c\uddf9",
  "Fran\u00e7a": "\ud83c\uddeb\ud83c\uddf7", "France": "\ud83c\uddeb\ud83c\uddf7",
  "Reino Unido": "\ud83c\uddec\ud83c\udde7", "UK": "\ud83c\uddec\ud83c\udde7", "United Kingdom": "\ud83c\uddec\ud83c\udde7",
  "Alemanha": "\ud83c\udde9\ud83c\uddea", "Germany": "\ud83c\udde9\ud83c\uddea",
  "Canad\u00e1": "\ud83c\udde8\ud83c\udde6", "Canada": "\ud83c\udde8\ud83c\udde6",
  "China": "\ud83c\udde8\ud83c\uddf3",
  "\u00c1ustria": "\ud83c\udde6\ud83c\uddf9", "Austria": "\ud83c\udde6\ud83c\uddf9",
  "Jap\u00e3o": "\ud83c\uddef\ud83c\uddf5", "Japan": "\ud83c\uddef\ud83c\uddf5",
  "Su\u00ed\u00e7a": "\ud83c\udde8\ud83c\udded", "Switzerland": "\ud83c\udde8\ud83c\udded",
  "Holanda": "\ud83c\uddf3\ud83c\uddf1", "Netherlands": "\ud83c\uddf3\ud83c\uddf1",
};

var SURFACE_COLORS = { "Saibro": "#D97706", "Clay": "#D97706", "Duro": "#3B82F6", "Hard": "#3B82F6", "Grama": "#16A34A", "Grass": "#16A34A" };
var SURFACE_PT = { "Clay": "Saibro", "Hard": "Duro", "Grass": "Grama", "Saibro": "Saibro", "Duro": "Duro", "Grama": "Grama" };
var CAT_COLORS = { "Grand Slam": "#6D35D0", "Masters 1000": "#c0392b", "ATP 500": "#2563EB", "ATP 250": "#6b7280", "Finals": "#b8860b" };

var FALLBACK = [
  { name: "Australian Open", cat: "Grand Slam", surface: "Duro", city: "Melbourne", country: "Austr\u00e1lia", start: "2026-01-18", end: "2026-02-01" },
  { name: "Rio Open", cat: "ATP 500", surface: "Saibro", city: "Rio de Janeiro", country: "Brasil", start: "2026-02-16", end: "2026-02-22" },
  { name: "Indian Wells Masters", cat: "Masters 1000", surface: "Duro", city: "Indian Wells", country: "EUA", start: "2026-03-09", end: "2026-03-22" },
  { name: "Miami Open", cat: "Masters 1000", surface: "Duro", city: "Miami", country: "EUA", start: "2026-03-23", end: "2026-04-05" },
  { name: "Monte Carlo", cat: "Masters 1000", surface: "Saibro", city: "Monte Carlo", country: "M\u00f4naco", start: "2026-04-05", end: "2026-04-12" },
  { name: "BMW Open", cat: "ATP 500", surface: "Saibro", city: "Munique", country: "Alemanha", start: "2026-04-13", end: "2026-04-19" },
  { name: "Madrid Open", cat: "Masters 1000", surface: "Saibro", city: "Madri", country: "Espanha", start: "2026-04-22", end: "2026-05-03" },
  { name: "Roma Masters", cat: "Masters 1000", surface: "Saibro", city: "Roma", country: "It\u00e1lia", start: "2026-05-06", end: "2026-05-17" },
  { name: "Roland Garros", cat: "Grand Slam", surface: "Saibro", city: "Paris", country: "Fran\u00e7a", start: "2026-05-24", end: "2026-06-07" },
  { name: "Wimbledon", cat: "Grand Slam", surface: "Grama", city: "Londres", country: "Reino Unido", start: "2026-06-29", end: "2026-07-12" },
  { name: "US Open", cat: "Grand Slam", surface: "Duro", city: "Nova York", country: "EUA", start: "2026-08-31", end: "2026-09-13" },
  { name: "ATP Finals", cat: "Finals", surface: "Duro", city: "Turim", country: "It\u00e1lia", start: "2026-11-15", end: "2026-11-22" },
];

function matchesName(calName, tournName) {
  if (!calName || !tournName) return false;
  var a = calName.toLowerCase().replace(/[^a-z0-9]/g, "");
  var b = tournName.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (a === b) return true;
  // Flexible: one contains the other or shares first significant word
  if (a.includes(b) || b.includes(a)) return true;
  var aWords = calName.toLowerCase().split(/[\s\-·]+/).filter(function(w) { return w.length > 3; });
  var bWords = tournName.toLowerCase().split(/[\s\-·]+/).filter(function(w) { return w.length > 3; });
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

  // Determine current tournament
  var currentTourn = null;
  if (nextMatch && nextMatch.tournament_name) currentTourn = nextMatch.tournament_name;
  else if (lastMatch && lastMatch.tournament_name) currentTourn = lastMatch.tournament_name;
  if (!currentTourn) return null;

  // Get calendar source
  var calendar = (atpCalendar && atpCalendar.tournaments && atpCalendar.tournaments.length >= 3)
    ? atpCalendar.tournaments : FALLBACK;

  // Sort by start date
  var sorted = calendar.slice().sort(function(a, b) { return (a.start || "").localeCompare(b.start || ""); });

  // Find current tournament index
  var currentIdx = -1;
  for (var i = 0; i < sorted.length; i++) {
    if (matchesName(sorted[i].name, currentTourn)) {
      currentIdx = i;
      break;
    }
  }

  // If not found, try to find next tournament by date
  if (currentIdx === -1) {
    var now = new Date().toISOString().split("T")[0];
    for (var j = 0; j < sorted.length; j++) {
      if (sorted[j].end && sorted[j].end >= now) {
        currentIdx = j;
        break;
      }
    }
  }

  // Get NEXT tournament (the one after current)
  if (currentIdx === -1 || currentIdx >= sorted.length - 1) return null;
  var next = sorted[currentIdx + 1];
  if (!next || !next.name) return null;

  var flag = FLAGS[next.country] || FLAGS[next.city] || "";
  var surfacePt = SURFACE_PT[next.surface] || next.surface || "";
  var surfaceColor = SURFACE_COLORS[next.surface] || "#999";
  var catColor = CAT_COLORS[next.cat] || "#6b7280";
  var dateRange = formatDateRange(next.start, next.end);

  return (
    <section style={{ padding: "8px 0 0" }}>
      <div style={{
        borderRadius: 16,
        background: "linear-gradient(135deg, #0D1726 0%, #142238 100%)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: "0 2px 12px rgba(10,18,32,0.2)",
      }}>
        {/* Flag */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: "rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, flexShrink: 0,
        }}>
          {flag || "\u2708\ufe0f"}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: "rgba(79,195,247,0.6)",
              fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              Pr\u00f3xima parada
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: SERIF, lineHeight: 1.2 }}>
              {next.name}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 700, color: catColor,
              background: catColor + "18", padding: "2px 8px",
              borderRadius: 99, fontFamily: SANS, whiteSpace: "nowrap",
            }}>
              {next.cat}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", fontFamily: SANS }}>
              {dateRange}
            </span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}>\u00b7</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: surfaceColor, fontFamily: SANS }}>
              {surfacePt}
            </span>
            {next.city && (
              <>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: SANS }}>\u00b7</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: SANS }}>
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
