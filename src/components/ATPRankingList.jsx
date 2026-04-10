import { useState, useEffect } from 'react';
import { GREEN, BG_ALT, TEXT, DIM, BORDER, SANS } from '../lib/constants';
import { formatTimeAgo } from '../lib/utils';

export default function ATPRankingList(props) {
  var currentRanking = props.currentRanking || 40;
  var _r = useState(null); var rankings = _r[0]; var setRankings = _r[1];
  var _l = useState(true); var loading = _l[0]; var setLoading = _l[1];
  useEffect(function() {
    fetch("/api/rankings").then(function(r) { return r.json(); }).then(function(d) {
      if (d && d.rankings && d.rankings.length > 0) setRankings(d);
      setLoading(false);
    }).catch(function() { setLoading(false); });
  }, []);
  if (loading) return <div style={{ padding: "40px 0", textAlign: "center" }}><span style={{ fontSize: 12, color: DIM, fontFamily: SANS }}>Carregando ranking...</span></div>;
  if (!rankings || !rankings.rankings || rankings.rankings.length === 0) return <div style={{ padding: "20px 0", textAlign: "center" }}><span style={{ fontSize: 12, color: DIM, fontFamily: SANS }}>Ranking indisponível. Aguarde a próxima atualização.</span></div>;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "0 4px" }}>
        <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}>Top 50 · ATP Singles</span>
        {rankings.updatedAt && <span style={{ fontSize: 10, color: DIM, fontFamily: SANS }}>{formatTimeAgo(rankings.updatedAt)}</span>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {rankings.rankings.map(function(r, i) {
          var isFonseca = (r.name || "").toLowerCase().includes("fonseca") || r.rank === currentRanking;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: isFonseca ? GREEN + "0A" : (i % 2 === 0 ? "transparent" : BG_ALT), borderRadius: isFonseca ? 10 : 0, border: isFonseca ? "1.5px solid " + GREEN + "30" : "none", borderBottom: isFonseca ? "none" : "1px solid " + BORDER + "80" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: isFonseca ? GREEN : DIM, fontFamily: SANS, width: 28, textAlign: "right", flexShrink: 0 }}>{r.rank}</span>
              <span style={{ fontSize: 13, fontWeight: isFonseca ? 700 : 500, color: isFonseca ? GREEN : TEXT, fontFamily: SANS, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
              {r.points && <span style={{ fontSize: 11, color: DIM, fontFamily: SANS, flexShrink: 0 }}>{r.points} pts</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
