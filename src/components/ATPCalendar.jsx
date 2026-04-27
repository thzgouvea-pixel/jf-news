import { GREEN, TEXT, DIM, SANS, SERIF } from '../lib/constants';

var CALENDAR = [
  { month: "JAN", name: "Australian Open", cat: "Grand Slam", surface: "Duro", city: "Melbourne", date: "12 Jan - 1 Fev", start: "2026-01-12" },
  { month: "FEV", name: "Rio Open", cat: "ATP 500", surface: "Saibro", city: "Rio de Janeiro", date: "16-22 Fev", start: "2026-02-16", extraResult: "Duplas 🏆" },
  { month: "MAR", name: "Indian Wells", aliases: ["Indian Wells Masters"], cat: "Masters 1000", surface: "Duro", city: "Califórnia", date: "4-15 Mar", start: "2026-03-04" },
  { month: "MAR", name: "Miami Open", cat: "Masters 1000", surface: "Duro", city: "Miami", date: "18-29 Mar", start: "2026-03-18" },
  { month: "ABR", name: "Monte Carlo", aliases: ["Monte Carlo Masters"], cat: "Masters 1000", surface: "Saibro", city: "Mônaco", date: "5-12 Abr", start: "2026-04-05" },
  { month: "ABR", name: "BMW Open", cat: "ATP 500", surface: "Saibro", city: "Munique", date: "13-19 Abr", start: "2026-04-13" },
  { month: "ABR", name: "Madrid Open", cat: "Masters 1000", surface: "Saibro", city: "Madri", date: "22 Abr - 3 Mai", start: "2026-04-22" },
  { month: "MAI", name: "Roma Masters", aliases: ["Italian Open"], cat: "Masters 1000", surface: "Saibro", city: "Roma", date: "6-17 Mai", start: "2026-05-06" },
  { month: "MAI", name: "Roland Garros", cat: "Grand Slam", surface: "Saibro", city: "Paris", date: "24 Mai - 7 Jun", start: "2026-05-24" },
  { month: "JUN", name: "Wimbledon", cat: "Grand Slam", surface: "Grama", city: "Londres", date: "29 Jun - 12 Jul", start: "2026-06-29" },
  { month: "AGO", name: "US Open", cat: "Grand Slam", surface: "Duro", city: "Nova York", date: "31 Ago - 13 Set", start: "2026-08-31" },
  { month: "NOV", name: "ATP Finals", cat: "Finals", surface: "Duro (indoor)", city: "Turim", date: "15-22 Nov", start: "2026-11-15" },
];

var ROUND_LABELS = {
  "1ª rodada": "R1", "2ª rodada": "R2", "3ª rodada": "R3",
  "16avos de final": "R3", "Oitavas de final": "R4",
  "Quartas de final": "QF", "Semifinal": "SF", "Final": "F",
};

function matchesTournament(formEntry, calEntry) {
  var t = (formEntry.tournament || "").toLowerCase();
  var n = calEntry.name.toLowerCase();
  if (t.includes(n) || n.includes(t)) return true;
  if (calEntry.aliases) {
    for (var i = 0; i < calEntry.aliases.length; i++) {
      if (t.includes(calEntry.aliases[i].toLowerCase())) return true;
    }
  }
  return false;
}

export default function ATPCalendar(props) {
  var recentForm = props.recentForm || [];
  var lastMatch = props.lastMatch;
  var nextMatch = props.nextMatch;
  var nextTournament = props.nextTournament;
  var dynamicCalendar = props.atpCalendar && props.atpCalendar.tournaments && props.atpCalendar.tournaments.length >= 5 ? props.atpCalendar.tournaments : null;
  var now = new Date();

  var catColors2 = { "Grand Slam": "#6D35D0", "Masters 1000": "#c0392b", "ATP 500": "#2563EB", "Finals": "#b8860b" };

  var calSource = dynamicCalendar || CALENDAR;
  var events = calSource.map(function(ev) {
    var tournStart = new Date(ev.start);
    var tournEnd = ev.end ? new Date(ev.end) : new Date(tournStart.getTime() + 14 * 86400000);
    var isPast = now > tournEnd;
    var isLive = now >= tournStart && now <= tournEnd;

    var matches = recentForm.filter(function(m) { return matchesTournament(m, ev); });

    var done = false;
    var result = null;
    var isNext = false;

    if (matches.length > 0) {
      done = true;
      var lastInTourn = matches[0];
      if (lastInTourn.result === "D") {
        var round = lastInTourn.round || "";
        result = ROUND_LABELS[round] || round || "—";
      } else {
        var allWins = matches.every(function(m) { return m.result === "V"; });
        if (allWins && matches.length >= 5) {
          result = "🏆";
        } else {
          var lastRound = lastInTourn.round || "";
          result = ROUND_LABELS[lastRound] || lastRound || "V";
        }
      }
    } else if (isPast) {
      done = true;
      result = "—";
    }

    if (ev.extraResult && done) {
      result = (result && result !== "—" ? result + " / " : "") + ev.extraResult;
    }

    var currentTourn = false;
    if (lastMatch && (lastMatch.tournament_name || "").toLowerCase().includes(ev.name.toLowerCase())) {
      currentTourn = true;
      if (!done) {
        done = false;
        isNext = true;
      }
    }
    if (nextMatch && (nextMatch.tournament_name || "").toLowerCase().includes(ev.name.toLowerCase())) {
      isNext = true;
      done = false;
      result = null;
    }
    if (!isNext && !done && nextTournament && (nextTournament.tournament_name || "").toLowerCase().includes(ev.name.toLowerCase())) {
      isNext = true;
    }
    if (!isNext && !done && !result) {
      var firstUndone = CALENDAR.find(function(c) {
        var cStart = new Date(c.start);
        return now < new Date(cStart.getTime() + 14 * 86400000) && !recentForm.some(function(m) { return matchesTournament(m, c); });
      });
      if (firstUndone && firstUndone.name === ev.name) isNext = true;
    }

    var status = "future";
    if (done && result !== "—") status = "completed";
    else if (done) status = "missed";
    else if (isNext && isLive) status = "live";
    else if (isNext) status = "upcoming";
    return { month: ev.month, name: ev.name, cat: ev.cat, surface: ev.surface, city: ev.city, date: ev.date, done: done, result: result, next: isNext, status: status };
  });

  return (
    <div style={{ padding: "12px 0", maxHeight: "70vh", overflowY: "auto" }}>
      {events.map(function(ev, i) {
        var cc = catColors2[ev.cat] || DIM;
        var isNext = ev.next;
        return (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 4px", borderBottom: i < events.length - 1 ? "1px solid #f0f0f0" : "none", background: ev.status === "live" ? "#ef444408" : (ev.status === "upcoming" ? "#f9731608" : "transparent"), borderRadius: ev.status === "live" || ev.status === "upcoming" ? 8 : 0
            <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: ev.done ? DIM : cc, fontFamily: SANS }}>{ev.month}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: ev.done ? DIM : TEXT, fontFamily: SERIF }}>{ev.name}</span>
                {ev.status === "live" && <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", fontFamily: SANS, background: "#ef4444", padding: "2px 7px", borderRadius: 999, letterSpacing: "0.05em" }}>● AGORA</span>}
                {ev.status === "upcoming" && <span style={{ fontSize: 9, fontWeight: 700, color: "#f97316", fontFamily: SANS, background: "#f9731612", padding: "2px 7px", borderRadius: 999, letterSpacing: "0.05em" }}>PRÓXIMO</span>}
              </div>
              <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>{ev.cat} · {ev.city} · {ev.date}</span>
            </div>
            <div style={{ flexShrink: 0 }}>
              {ev.done && ev.result ? <span style={{ fontSize: 10, fontWeight: 600, color: ev.result.includes("🏆") ? GREEN : DIM, fontFamily: SANS }}>{ev.result}</span> : isNext ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, display: "inline-block" }} /> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
