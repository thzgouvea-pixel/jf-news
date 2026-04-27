// src/components/CareerTimeline.jsx
// v2: Híbrido. Eventos pré-2026 e até Monte Carlo hardcoded; eventos pós-Monte Carlo
// gerados dinamicamente a partir de recentForm (via /api/all-data).
import { useState, useEffect } from 'react';
import { GREEN, YELLOW, RED, TEXT, SUB, DIM, SANS, SERIF } from '../lib/constants';

var MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function monthLabel(date) {
  var d = new Date(date);
  return MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
}

// Eventos hardcoded até Monte Carlo (Abr 2026). BMW Open removido — vem dinâmico.
var HARDCODED_EVENTS = [
  { date: "Ago 2006", title: "Nasce no Rio de Janeiro", desc: "Bairro de Ipanema", emoji: "👶", color: DIM, sortKey: "2006-08-01" },
  { date: "2010", title: "Começa no tênis", desc: "Primeiras aulas no Country Club", emoji: "🎾", color: DIM, sortKey: "2010-01-01" },
  { date: "Set 2023", title: "Nº1 mundial juvenil", desc: "Campeão do US Open Jr", emoji: "🏆", color: GREEN, sortKey: "2023-09-01" },
  { date: "Fev 2024", title: "Estreia ATP no Rio Open", desc: "Derrota Arthur Fils (#36)", emoji: "🇧🇷", color: GREEN, sortKey: "2024-02-01" },
  { date: "Dez 2024", title: "Campeão NextGen", desc: "Invicto em 5 jogos", emoji: "🏆", color: GREEN, sortKey: "2024-12-01" },
  { date: "Jan 2025", title: "Derrota Rublev no AO", desc: "Top 10 na R1 de Grand Slam", emoji: "🔥", color: RED, sortKey: "2025-01-01" },
  { date: "Fev 2025", title: "1º título ATP", desc: "Buenos Aires 250", emoji: "🏆", color: GREEN, sortKey: "2025-02-01" },
  { date: "Jul 2025", title: "Wimbledon R3", desc: "1º brasileiro desde Bellucci 2010", emoji: "🌿", color: GREEN, sortKey: "2025-07-01" },
  { date: "Out 2025", title: "Campeão Basel 500", desc: "1º brasileiro a ganhar ATP 500", emoji: "🏆", color: YELLOW, sortKey: "2025-10-01" },
  { date: "Fev 2026", title: "Duplas no Rio Open", desc: "Título de duplas em casa", emoji: "🤝", color: "#3B82F6", sortKey: "2026-02-15" },
  { date: "Mar 2026", title: "R4 em Indian Wells", desc: "Vitórias sobre Paul e Khachanov, épico vs Sinner", emoji: "🎯", color: GREEN, sortKey: "2026-03-15" },
  { date: "Abr 2026", title: "QF em Monte Carlo", desc: "3 vitórias incl. Berrettini, derrota honrosa vs #3 Zverev", emoji: "🔥", color: RED, sortKey: "2026-04-10" },
];

// Torneios ja cobertos pelo hardcoded — para nao duplicar quando recentForm os trouxer
var EXCLUDED_TOURNAMENTS = ["indian wells", "bnp paribas", "miami", "monte carlo", "monte-carlo", "rio open", "australian open"];

// Gera eventos dinâmicos a partir do recentForm. Agrupa por torneio e infere fase pela contagem.
// Lógica: 1V seguido de D = estreia caída; 2V+D = QF; 3V+D = SF; 4V+D = Final perdida; 5V seguidas e última = D = Final.
function generateDynamicEvents(recentForm) {
  if (!Array.isArray(recentForm) || recentForm.length === 0) return [];

  // Filtra so 2026 e exclui torneios ja cobertos no hardcoded
  var matches2026 = recentForm.filter(function(m) {
    if (!m.date) return false;
    var dt = new Date(m.date);
    if (dt.getFullYear() !== 2026) return false;
    var t = (m.tournament || "").toLowerCase();
    return !EXCLUDED_TOURNAMENTS.some(function(ex) { return t.indexOf(ex) !== -1; });
  });

  // Agrupa por torneio
  var byTournament = {};
  matches2026.forEach(function(m) {
    var t = m.tournament;
    if (!byTournament[t]) byTournament[t] = [];
    byTournament[t].push(m);
  });

  var events = [];
  Object.keys(byTournament).forEach(function(t) {
    var matches = byTournament[t];
    // Ordena cronologicamente (mais antigo primeiro) pra contar V/D em sequencia
    matches.sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    var lastMatch = matches[matches.length - 1];
    var totalV = matches.filter(function(m) { return m.result === "V"; }).length;
    var lastResult = lastMatch.result;
    var opp = lastMatch.opponent_name || "?";
    var label = monthLabel(lastMatch.date);

    var title, desc, emoji, color;

    if (lastResult === "V") {
      // Ultima foi vitoria — torneio em andamento
      title = t + " · em andamento";
      desc = totalV + " vitória" + (totalV > 1 ? "s" : "") + " (última vs " + opp + ")";
      emoji = "🏟️";
      color = GREEN;
    } else {
      // Caiu. Inferir fase pela contagem de vitorias antes da derrota.
      if (totalV === 0) {
        title = t;
        desc = "Eliminado na estreia vs " + opp;
        emoji = "🎾";
        color = "#888";
      } else if (totalV >= 4) {
        title = "Vice em " + t;
        desc = totalV + " vitórias, derrota na final vs " + opp;
        emoji = "🥈";
        color = YELLOW;
      } else if (totalV === 3) {
        title = "SF em " + t;
        desc = "3 vitórias, parou nas semis vs " + opp;
        emoji = "🔥";
        color = RED;
      } else if (totalV === 2) {
        title = "QF em " + t;
        desc = "2 vitórias, parou nas quartas vs " + opp;
        emoji = "🎯";
        color = GREEN;
      } else { // totalV === 1
        title = t;
        desc = "1 vitória, eliminado vs " + opp;
        emoji = "🎾";
        color = "#888";
      }
    }

    events.push({
      date: label,
      title: title,
      desc: desc,
      emoji: emoji,
      color: color,
      sortKey: lastMatch.date,
    });
  });

  return events;
}

export default function CareerTimeline() {
  var _data = useState(null); var data = _data[0]; var setData = _data[1];

  useEffect(function() {
    fetch("/api/all-data").then(function(r) { return r.json(); }).then(function(d) {
      setData(d);
    }).catch(function() {});
  }, []);

  var dynamicEvents = data ? generateDynamicEvents(data.recentForm) : [];
  var allEvents = HARDCODED_EVENTS.concat(dynamicEvents);

  // Ordena cronologico (mais antigo primeiro)
  allEvents.sort(function(a, b) {
    return new Date(a.sortKey) - new Date(b.sortKey);
  });

  return (
    <div style={{ padding: "16px 0", maxHeight: "65vh", overflowY: "auto" }}>
      <div style={{ position: "relative", paddingLeft: 24 }}>
        <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 1.5, background: "#e8e8e8", borderRadius: 1 }} />
        {allEvents.map(function(ev, i) {
          var isTitle = ev.emoji === "🏆";
          return (
            <div key={i} style={{ position: "relative", marginBottom: i < allEvents.length - 1 ? 14 : 0 }}>
              <div style={{ position: "absolute", left: -20, top: 6, width: 10, height: 10, borderRadius: "50%", background: isTitle ? ev.color : "#fff", border: "2px solid " + ev.color, zIndex: 1 }} />
              <div style={{ paddingBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: ev.color, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em" }}>{ev.date}</span>
                  <span style={{ fontSize: 14 }}>{ev.emoji}</span>
                </div>
                <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>{ev.title}</p>
                <p style={{ margin: 0, fontSize: 12, color: SUB, fontFamily: SANS }}>{ev.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
