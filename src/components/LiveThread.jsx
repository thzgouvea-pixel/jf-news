import { GREEN, RED, DIM, BORDER, SANS, SERIF, TEXT } from '../lib/constants';

// Linha do tempo de eventos da partida ao vivo.
// Props: thread (array de { kind, text, ts, score? }) — mais novo no topo.

function fmtTime(iso) {
  try {
    var d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", {
      hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
    });
  } catch (e) { return ""; }
}

function dotColor(kind) {
  if (kind === "match_won_f" || kind === "set_won_f" || kind === "break_f") return GREEN;
  if (kind === "match_won_o" || kind === "set_won_o" || kind === "break_o") return RED;
  return "#4FC3F7"; // azul info pra match_start
}

export default function LiveThread(props) {
  var thread = props.thread;
  if (!Array.isArray(thread) || thread.length === 0) return null;

  // Mais novo no topo
  var ordered = thread.slice().reverse();

  return (
    <section style={{
      margin: "12px 0 0",
      background: "#0a1220",
      borderRadius: 22,
      padding: "16px 18px",
      boxShadow: "0 4px 20px rgba(10,18,32,0.25)",
      color: "#fff",
      fontFamily: SANS,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{
          width: 8, height: 8, borderRadius: 999, background: GREEN,
          boxShadow: "0 0 0 4px " + GREEN + "30", display: "inline-block",
        }} />
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.7)", fontFamily: SANS,
        }}>
          Acompanhamento ao vivo
        </span>
      </div>

      <ol style={{
        listStyle: "none", padding: 0, margin: 0,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {ordered.map(function (ev, idx) {
          return (
            <li key={ev.ts + "-" + ev.kind + "-" + idx} style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              paddingBottom: 10,
              borderBottom: idx < ordered.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
              <span style={{
                marginTop: 6, width: 8, height: 8, borderRadius: 999,
                background: dotColor(ev.kind), flexShrink: 0,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, color: "rgba(255,255,255,0.92)", fontFamily: SANS,
                  fontWeight: ev.kind && ev.kind.indexOf("match_won") === 0 ? 700 : 500,
                  lineHeight: 1.35,
                }}>
                  {ev.text}
                </div>
                <div style={{
                  fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: SANS,
                  marginTop: 2, letterSpacing: "0.04em",
                }}>
                  {fmtTime(ev.ts)}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
