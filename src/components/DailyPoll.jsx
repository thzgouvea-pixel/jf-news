import { useState, useEffect } from 'react';
import { GREEN, BG_ALT, TEXT, SUB, DIM, BORDER, SANS, SERIF } from '../lib/constants';

export default function DailyPoll() {
  var now = new Date();
  var today = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  var pollKey = "fn_poll_" + today;
  var _v = useState(function() { try { return localStorage.getItem(pollKey); } catch(e) { return null; } });
  var vote = _v[0]; var setVote = _v[1];
  var _r = useState(function() { try { var d = JSON.parse(localStorage.getItem(pollKey + "_r") || "null"); return d; } catch(e) { return null; } });
  var results = _r[0]; var setResults = _r[1];
  var polls = [
    { q: "O João vai vencer o próximo jogo?", a: "Sim!", b: "Não" },
    { q: "O João chega ao Top 30 até o fim de 2026?", a: "Com certeza!", b: "Difícil" },
    { q: "O João vai conquistar um Masters 1000 na carreira?", a: "Vai sim!", b: "Acho que não" },
    { q: "Quem vai ter a melhor carreira?", a: "João 🇧🇷", b: "Tien 🇺🇸" },
    { q: "O João chega às quartas de final em Roland Garros?", a: "Chega sim!", b: "Ainda é cedo" },
    { q: "O João entra no Top 10 até 2027?", a: "Com certeza!", b: "Precisa de tempo" },
    { q: "Quem é mais talentoso aos 19 anos?", a: "João 🇧🇷", b: "Alcaraz 🇪🇸" },
    { q: "O João chega ao Top 5 antes dos 21 anos?", a: "Sem dúvida!", b: "É muito cedo" },
    { q: "O João vai ganhar um Grand Slam na carreira?", a: "Vai sim!", b: "Não acredito" },
    { q: "Qual a melhor superfície do João?", a: "Saibro", b: "Piso duro" },
    { q: "O João seria top 10 se fosse espanhol?", a: "Já seria!", b: "Não muda nada" },
    { q: "O forehand do João é o melhor da NextGen?", a: "Sem dúvida!", b: "Tem melhores" },
    { q: "O João vai ser nº1 do mundo algum dia?", a: "Vai sim!", b: "É sonhar demais" },
    { q: "Quem tem o melhor saque da NextGen?", a: "João 🇧🇷", b: "Mensik 🇨🇿" },
    { q: "O João deve jogar mais torneios de saibro?", a: "Sim, é sua força", b: "Precisa variar" },
    { q: "O João vai superar o Guga em conquistas?", a: "Com certeza!", b: "Guga é lenda" },
    { q: "O melhor jogo do João até agora foi vs Rublev no AO?", a: "Foi sim!", b: "Tem outros" },
    { q: "O João deveria focar em simples ou jogar duplas também?", a: "Só simples", b: "Duplas ajuda" },
    { q: "Quem chega primeiro ao Top 10?", a: "João 🇧🇷", b: "Fils 🇫🇷" },
    { q: "O João faz semifinal de Grand Slam em 2026?", a: "Faz sim!", b: "Ainda não" },
    { q: "O tênis brasileiro vive sua melhor fase?", a: "Com certeza!", b: "Guga era melhor" },
    { q: "O João deve mudar de treinador?", a: "Não, está bem", b: "Precisa evoluir" },
    { q: "O mental do João é seu maior diferencial?", a: "Sem dúvida!", b: "É o forehand" },
    { q: "O João vai liderar o Brasil na Copa Davis?", a: "Já lidera!", b: "Precisa de mais" },
    { q: "Qual Grand Slam o João vai ganhar primeiro?", a: "Roland Garros", b: "US Open" },
    { q: "O João termina 2026 no Top 20?", a: "Com certeza!", b: "Top 30 já é bom" },
    { q: "Quem é a maior promessa do tênis mundial?", a: "João 🇧🇷", b: "Draper 🇬🇧" },
    { q: "O João deve jogar o Rio Open todo ano?", a: "Sempre!", b: "Só quando fizer sentido" },
  ];
  var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  var poll = polls[dayOfYear % polls.length];
  useEffect(function() {
    fetch("/api/vote").then(function(r) { return r.json(); }).then(function(d) { if (d && d.total > 0) { setResults({ a: d.pctA, b: d.pctB, total: d.total }); } }).catch(function() {});
  }, []);
  var handleVote = function(choice) {
    if (vote) return;
    setVote(choice);
    try { localStorage.setItem(pollKey, choice); } catch(e) {}
    fetch("/api/vote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ option: choice }) }).then(function(r) { return r.json(); }).then(function(d) { if (d && d.total > 0) { setResults({ a: d.pctA, b: d.pctB, total: d.total }); } }).catch(function() { setResults(choice === "a" ? { a: 62, b: 38, total: 1 } : { a: 45, b: 55, total: 1 }); });
  };
  return (
    <div style={{ padding: "18px 16px", background: BG_ALT, borderRadius: 10, margin: "4px 0", border: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: SANS, background: GREEN, padding: "2px 6px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>Enquete</span>
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: SERIF, lineHeight: 1.4 }}>{poll.q}</p>
      {!vote ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={function() { handleVote("a"); }} style={{ flex: 1, padding: "10px", background: "rgba(0,168,89,0.06)", border: "1px solid rgba(0,168,89,0.2)", borderRadius: 10, fontSize: 13, fontWeight: 700, color: GREEN, cursor: "pointer", fontFamily: SANS }}>{poll.a}</button>
          <button onClick={function() { handleVote("b"); }} style={{ flex: 1, padding: "10px", background: "#f0f0f0", border: "1px solid " + BORDER, borderRadius: 10, fontSize: 13, fontWeight: 700, color: TEXT, cursor: "pointer", fontFamily: SANS }}>{poll.b}</button>
        </div>
      ) : (
        <div>
          {[["a", poll.a], ["b", poll.b]].map(function(pair) {
            var k = pair[0]; var label = pair[1]; var pct = results ? results[k] : 50;
            return (
              <div key={k} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: vote === k ? GREEN : SUB, fontFamily: SANS }}>{label} {vote === k ? "✓" : ""}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: DIM, fontFamily: SANS }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: "#e8e8e8", borderRadius: 2 }}><div style={{ height: 4, background: k === "a" ? GREEN : DIM, borderRadius: 2, width: pct + "%", transition: "width 0.8s ease" }} /></div>
              </div>
            );
          })}
          <p style={{ margin: "8px 0 0", fontSize: 10, color: DIM, fontFamily: SANS, textAlign: "center" }}>{results && results.total ? results.total + (results.total === 1 ? " voto" : " votos") : "Seja o primeiro a votar"} · Nova enquete amanhã</p>
        </div>
      )}
    </div>
  );
}
