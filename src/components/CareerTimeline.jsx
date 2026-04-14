import { GREEN, YELLOW, RED, TEXT, SUB, DIM, SANS, SERIF } from '../lib/constants';

export default function CareerTimeline() {
  var events = [
    { date: "Ago 2006", title: "Nasce no Rio de Janeiro", desc: "Bairro de Ipanema", emoji: "👶", color: DIM },
    { date: "2010", title: "Começa no tênis", desc: "Primeiras aulas no Country Club", emoji: "🎾", color: DIM },
    { date: "Set 2023", title: "Nº1 mundial juvenil", desc: "Campeão do US Open Jr", emoji: "🏆", color: GREEN },
    { date: "Fev 2024", title: "Estreia ATP no Rio Open", desc: "Derrota Arthur Fils (#36)", emoji: "🇧🇷", color: GREEN },
    { date: "Dez 2024", title: "Campeão NextGen", desc: "Invicto em 5 jogos", emoji: "🏆", color: GREEN },
    { date: "Jan 2025", title: "Derrota Rublev no AO", desc: "Top 10 na R1 de Grand Slam", emoji: "🔥", color: RED },
    { date: "Fev 2025", title: "1º título ATP", desc: "Buenos Aires 250", emoji: "🏆", color: GREEN },
    { date: "Jul 2025", title: "Wimbledon R3", desc: "1º brasileiro desde Bellucci 2010", emoji: "🌿", color: GREEN },
    { date: "Out 2025", title: "Campeão Basel 500", desc: "1º brasileiro a ganhar ATP 500", emoji: "🏆", color: YELLOW },
    { date: "Fev 2026", title: "Duplas no Rio Open", desc: "Título de duplas em casa", emoji: "🤝", color: "#3B82F6" },
    { date: "Mar 2026", title: "R4 em Indian Wells", desc: "Vitórias sobre Paul e Khachanov, épico vs Sinner", emoji: "🎯", color: GREEN },
    { date: "Abr 2026", title: "QF em Monte Carlo", desc: "3 vitórias incl. Berrettini, derrota honrosa vs #3 Zverev", emoji: "🔥", color: RED },
    { date: "Abr 2026", title: "BMW Open · Munique", desc: "Em andamento — ATP 500 no saibro alemão", emoji: "🏟️", color: GREEN },
  ];
  return (
    <div style={{ padding: "16px 0", maxHeight: "65vh", overflowY: "auto" }}>
      <div style={{ position: "relative", paddingLeft: 24 }}>
        <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 1.5, background: "#e8e8e8", borderRadius: 1 }} />
        {events.map(function(ev, i) { var isTitle = ev.emoji === "🏆"; return (<div key={i} style={{ position: "relative", marginBottom: i < events.length - 1 ? 14 : 0 }}><div style={{ position: "absolute", left: -20, top: 6, width: 10, height: 10, borderRadius: "50%", background: isTitle ? ev.color : "#fff", border: "2px solid " + ev.color, zIndex: 1 }} /><div style={{ paddingBottom: 4 }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 10, fontWeight: 600, color: ev.color, fontFamily: SANS, textTransform: "uppercase", letterSpacing: "0.04em" }}>{ev.date}</span><span style={{ fontSize: 14 }}>{ev.emoji}</span></div><p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>{ev.title}</p><p style={{ margin: 0, fontSize: 12, color: SUB, fontFamily: SANS }}>{ev.desc}</p></div></div>); })}
      </div>
    </div>
  );
}
