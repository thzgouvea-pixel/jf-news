import { GREEN, TEXT, DIM, SANS, SERIF } from '../lib/constants';

export default function ATPCalendar() {
  var events = [
    { month: "JAN", name: "Australian Open", cat: "Grand Slam", surface: "Duro", city: "Melbourne", date: "12 Jan - 1 Fev", done: true, result: "R1" },
    { month: "FEV", name: "Rio Open", cat: "ATP 500", surface: "Saibro", city: "Rio de Janeiro", date: "16-22 Fev", done: true, result: "Duplas 🏆" },
    { month: "MAR", name: "Indian Wells", cat: "Masters 1000", surface: "Duro", city: "Califórnia", date: "4-15 Mar", done: true, result: "R3" },
    { month: "MAR", name: "Miami Open", cat: "Masters 1000", surface: "Duro", city: "Miami", date: "18-29 Mar", done: true, result: "R3" },
    { month: "ABR", name: "Monte Carlo", cat: "Masters 1000", surface: "Saibro", city: "Mônaco", date: "5-12 Abr", done: false, next: true },
    { month: "ABR", name: "Madrid Open", cat: "Masters 1000", surface: "Saibro", city: "Madri", date: "22 Abr - 3 Mai", done: false },
    { month: "MAI", name: "Roma Masters", cat: "Masters 1000", surface: "Saibro", city: "Roma", date: "6-17 Mai", done: false },
    { month: "MAI", name: "Roland Garros", cat: "Grand Slam", surface: "Saibro", city: "Paris", date: "24 Mai - 7 Jun", done: false },
    { month: "JUN", name: "Wimbledon", cat: "Grand Slam", surface: "Grama", city: "Londres", date: "29 Jun - 12 Jul", done: false },
    { month: "AGO", name: "US Open", cat: "Grand Slam", surface: "Duro", city: "Nova York", date: "31 Ago - 13 Set", done: false },
    { month: "NOV", name: "ATP Finals", cat: "Finals", surface: "Duro (indoor)", city: "Turim", date: "15-22 Nov", done: false },
  ];
  var catColors2 = { "Grand Slam": "#6D35D0", "Masters 1000": "#c0392b", "ATP 500": "#2563EB", "Finals": "#b8860b" };
  return (
    <div style={{ padding: "12px 0", maxHeight: "70vh", overflowY: "auto" }}>
      {events.map(function(ev, i) { var cc = catColors2[ev.cat] || DIM; var isNext = ev.next; return (<div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 4px", borderBottom: i < events.length - 1 ? "1px solid #f0f0f0" : "none", background: isNext ? GREEN + "06" : "transparent", borderRadius: isNext ? 8 : 0 }}><div style={{ width: 36, textAlign: "center", flexShrink: 0 }}><span style={{ fontSize: 10, fontWeight: 700, color: ev.done ? DIM : cc, fontFamily: SANS }}>{ev.month}</span></div><div style={{ flex: 1 }}><div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}><span style={{ fontSize: 14, fontWeight: 700, color: ev.done ? DIM : TEXT, fontFamily: SERIF }}>{ev.name}</span>{isNext && <span style={{ fontSize: 9, fontWeight: 600, color: GREEN, fontFamily: SANS, background: GREEN + "0A", padding: "1px 6px", borderRadius: 999 }}>Próximo</span>}</div><span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>{ev.cat} · {ev.city} · {ev.date}</span></div><div style={{ flexShrink: 0 }}>{ev.done ? <span style={{ fontSize: 10, fontWeight: 600, color: ev.result && ev.result.includes("🏆") ? GREEN : DIM, fontFamily: SANS }}>{ev.result}</span> : isNext ? <span style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN, display: "inline-block" }} /> : null}</div></div>); })}
    </div>
  );
}
