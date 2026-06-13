import { GREEN, RED, DIM, SANS, SERIF, countryFlags } from '../lib/constants';
import { getATPImage, getESPNImage } from '../lib/utils';

// Card "Perfil do adversario" — aparece abaixo do NextDuelCard quando:
//  (a) ha adversario definido (nao "A definir")
//  (b) temos pelo menos uma stat da temporada pra mostrar
// Dados vem do cron-update (Gemini grounded → fn:opponentSeasonStats).

function ProgressBar(props) {
  var value = props.value;
  var label = props.label;
  var color = props.color || "#4FC3F7";
  if (typeof value !== "number") return null;
  var pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontFamily: SANS }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", letterSpacing: "0.02em" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{Math.round(value) + "%"}</span>
      </div>
      <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: pct + "%", background: color,
          borderRadius: 999, transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}

export default function OpponentDeepCard(props) {
  var stats = props.stats;
  var opponent = props.opponent; // { name, country, ranking }
  // Se o backend marcou os dados como stale pro contexto atual (janela critica
  // antes/durante o jogo), esconde em vez de mostrar valor obsoleto. Vai voltar
  // assim que o cron refrescar.
  if (props.stale) return null;
  if (!stats || !opponent || !opponent.name) return null;

  var lastN = opponent.name.split(" ").pop().toLowerCase();
  var statsName = (stats.opponent_name || "").split(" ").pop().toLowerCase();
  if (lastN !== statsName) return null; // sanity: dados precisam ser deste adversario

  // Ranking exibido: SEMPRE o autoritativo (SofaScore, via opponent.ranking).
  // Antes mostravamos stats.rank_current do Gemini, que delirava (#53 quando o
  // real era #59). Caimos pro rank_current so se nao houver o autoritativo.
  var displayRank = typeof opponent.ranking === "number" ? opponent.ranking
    : (typeof stats.rank_current === "number" ? stats.rank_current : null);

  // W-L
  var hasWL = typeof stats.wins_year === "number" && typeof stats.losses_year === "number";
  var winPct = null;
  if (hasWL) {
    var tot = stats.wins_year + stats.losses_year;
    if (tot > 0) winPct = Math.round((stats.wins_year / tot) * 100);
  }

  var hasServeStats = typeof stats.first_serve_pct === "number" ||
    typeof stats.first_serve_won_pct === "number" ||
    typeof stats.break_points_won_pct === "number";
  var hasMisc = typeof stats.aces_per_match === "number" ||
    typeof stats.double_faults_per_match === "number";

  // Se nao tem NENHUMA stat util, nao mostra o card (evita card vazio)
  if (!hasWL && !hasServeStats && !hasMisc && !stats.best_win_year && typeof stats.titles_year !== "number") return null;

  var year = stats.year || new Date().getFullYear();
  var atpImg = getATPImage(opponent.name);
  var espnImg = getESPNImage(opponent.name);
  var initial = opponent.name.charAt(0).toUpperCase();
  var flag = opponent.country ? (countryFlags[opponent.country] || "") : "";

  return (
    <section style={{ padding: "12px 0 0" }}>
      <div style={{
        borderRadius: 22, overflow: "hidden",
        background: "linear-gradient(160deg, #0a1220 0%, #111d33 40%, #0d1828 100%)",
        boxShadow: "0 4px 20px rgba(10,18,32,0.25)",
        position: "relative",
      }}>
        {/* radial accent */}
        <div style={{
          position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,195,247,0.10) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        <div style={{ padding: "18px 20px 4px", position: "relative" }}>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.10em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)", fontFamily: SANS, marginBottom: 12,
          }}>
            Perfil do adversário · {year}
          </div>

          {/* Header: avatar + name + flag + ranking */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: "#152035",
              border: "2px solid rgba(255,255,255,0.10)", overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {atpImg ? (
                <img src={atpImg} alt={opponent.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={function (e) {
                    if (espnImg && !e.target.dataset.tried) { e.target.dataset.tried = "1"; e.target.src = espnImg; }
                    else { e.target.style.display = "none"; }
                  }} />
              ) : (
                <span style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.35)", fontFamily: SERIF }}>{initial}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 19, fontWeight: 800, color: "#fff", fontFamily: SERIF,
                letterSpacing: "-0.01em", lineHeight: 1.2,
              }}>{opponent.name}</div>
              <div style={{
                fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: SANS, marginTop: 4,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                {flag && <span>{flag}</span>}
                {opponent.country && <span>{opponent.country}</span>}
                {typeof displayRank === "number" && (
                  <span style={{ color: "#4FC3F7", fontWeight: 700 }}>#{displayRank}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* W-L + titulos */}
        {(hasWL || typeof stats.titles_year === "number") && (
          <div style={{ padding: "0 20px 16px", display: "flex", gap: 10 }}>
            {hasWL && (
              <div style={{
                flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 14, padding: "12px 14px",
              }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)", fontFamily: SANS, marginBottom: 4,
                }}>Vitórias / Derrotas</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: SERIF }}>
                  <span style={{ color: GREEN }}>{stats.wins_year}V</span>
                  <span style={{ opacity: 0.4, margin: "0 6px" }}>·</span>
                  <span style={{ color: "#ef4444" }}>{stats.losses_year}D</span>
                </div>
                {winPct !== null && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: SANS, marginTop: 2 }}>
                    {winPct}% de aproveitamento
                  </div>
                )}
              </div>
            )}
            {typeof stats.titles_year === "number" && (
              <div style={{
                flex: hasWL ? 0 : 1, minWidth: hasWL ? 110 : 0,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 14, padding: "12px 14px",
              }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)", fontFamily: SANS, marginBottom: 4,
                }}>Títulos {year}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", fontFamily: SERIF }}>
                  {stats.titles_year}
                  <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginLeft: 6, fontFamily: SANS }}>
                    {stats.titles_year === 1 ? "título" : "títulos"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saque / break points */}
        {(hasServeStats || hasMisc) && (
          <div style={{ padding: "0 20px 16px" }}>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 14, padding: "14px 16px",
            }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)", fontFamily: SANS, marginBottom: 10,
              }}>Estatísticas {year}</div>
              {hasServeStats && (
                <div>
                  <ProgressBar label="1º saque (acerto)" value={stats.first_serve_pct} />
                  <ProgressBar label="Pontos no 1º saque" value={stats.first_serve_won_pct} />
                  <ProgressBar label="Break points convertidos" value={stats.break_points_won_pct} color="#22c55e" />
                </div>
              )}
              {hasMisc && (
                <div style={{ display: "flex", gap: 14, marginTop: hasServeStats ? 4 : 0, paddingTop: hasServeStats ? 8 : 0, borderTop: hasServeStats ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  {typeof stats.aces_per_match === "number" && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: SANS }}>Aces/jogo</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: SERIF }}>
                        {stats.aces_per_match.toFixed(1)}
                      </div>
                    </div>
                  )}
                  {typeof stats.double_faults_per_match === "number" && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: SANS }}>D. faltas/jogo</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: SERIF }}>
                        {stats.double_faults_per_match.toFixed(1)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Melhor vitoria do ano */}
        {stats.best_win_year && (
          <div style={{ padding: "0 20px 18px" }}>
            <div style={{
              background: "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(34,197,94,0.02))",
              border: "1px solid rgba(34,197,94,0.18)",
              borderRadius: 14, padding: "12px 14px",
            }}>
              <div style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                color: "rgba(34,197,94,0.75)", fontFamily: SANS, marginBottom: 6,
              }}>Maior vitória do ano</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.92)", fontFamily: SANS, fontWeight: 600 }}>
                {stats.best_win_year}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
