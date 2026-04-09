import { useState, useEffect } from "react";
import { GREEN, RED, BG_ALT, TEXT, SUB, DIM, BORDER, SERIF, SANS, catColors, formatTimeAgo } from "./constants";
import DailyPoll from "./PollCard";

// ===== SKELETON =====
export var Skeleton = function() { return (<div>{[...Array(4)].map(function(_, i) { return (<div key={i} style={{ padding: "22px 0", borderBottom: "1px solid " + BORDER, animation: "pulse 1.8s ease-in-out infinite", animationDelay: (i * .12) + "s" }}><div style={{ height: 12, width: 70, background: "#f0f0f0", borderRadius: 4, marginBottom: 10 }} /><div style={{ height: 16, width: "85%", background: "#f0f0f0", borderRadius: 4, marginBottom: 8 }} /><div style={{ height: 14, width: "60%", background: "#f5f5f5", borderRadius: 4 }} /></div>); })}</div>); };

// ===== QUIZ GAME =====
export var QuizGame = function() {
  var _q = useState(0); var currentQ = _q[0]; var setCurrentQ = _q[1];
  var _sc = useState(0); var score = _sc[0]; var setScore = _sc[1];
  var _sel = useState(null); var selected = _sel[0]; var setSelected = _sel[1];
  var _done = useState(false); var done = _done[0]; var setDone = _done[1];
  var _started = useState(false); var started = _started[0]; var setStarted = _started[1];
  var _revealed = useState(false); var revealed = _revealed[0]; var setRevealed = _revealed[1];
  var _qc = useState(null); var quizCount = _qc[0]; var setQuizCount = _qc[1];
  useEffect(function() {
    fetch("/api/quiz-count").then(function(r) { return r.json(); }).then(function(d) { if (d && typeof d.count === "number") setQuizCount(d.count); }).catch(function() {});
  }, []);
  var allQuestions = [
    { q: "Em que bairro do Rio de Janeiro o João nasceu?", opts: ["Copacabana", "Ipanema", "Leblon", "Barra da Tijuca"], answer: 1, points: 10, fun: "Ele cresceu a 10 minutos do local do Rio Open!" },
    { q: "Qual Grand Slam juvenil o João conquistou em 2023?", opts: ["Australian Open", "Roland Garros", "Wimbledon", "US Open"], answer: 3, points: 10, fun: "Derrotou Learner Tien na final!" },
    { q: "Quem o João derrotou na estreia do Australian Open 2025?", opts: ["Djokovic", "Alcaraz", "Rublev", "Medvedev"], answer: 2, points: 15, fun: "Primeiro adolescente a derrotar um top 10 em 1ª rodada de Grand Slam desde 2002!" },
    { q: "Em qual cidade o João conquistou seu primeiro título ATP?", opts: ["Basel", "Rio de Janeiro", "Buenos Aires", "Santiago"], answer: 2, points: 10, fun: "Brasileiro mais jovem a conquistar um título ATP!" },
    { q: "Qual torneio o João venceu invicto com 5 vitórias em 2024?", opts: ["ATP Finals", "NextGen ATP Finals", "Copa Davis", "Laver Cup"], answer: 1, points: 15, fun: "Primeiro sul-americano campeão do NextGen Finals!" },
    { q: "Em qual cidade o João conquistou seu primeiro ATP 500?", opts: ["Viena", "Hamburgo", "Basel", "Barcelona"], answer: 2, points: 15, fun: "Primeiro brasileiro a ganhar um ATP 500!" },
    { q: "Com que idade o João se tornou profissional?", opts: ["15 anos", "16 anos", "17 anos", "18 anos"], answer: 2, points: 10, fun: "Ele recusou uma bolsa milionária de universidade americana!" },
    { q: "Qual o recorde de vitórias do João no circuito juvenil?", opts: ["72-27", "82-27", "92-27", "102-27"], answer: 2, points: 10, fun: "Foi o 1º brasileiro nº1 do ranking juvenil!" },
    { q: "Em qual clube do Rio o João começou a jogar tênis?", opts: ["Flamengo", "Country Club", "Caiçaras", "Paissandu"], answer: 1, points: 10, fun: "O clube fica a poucos metros da casa onde ele cresceu!" },
    { q: "Quem o João derrotou na final do seu primeiro título ATP?", opts: ["Baez", "Cerúndolo", "Etcheverry", "Jarry"], answer: 1, points: 15, fun: "Venceu o argentino em Buenos Aires, na casa dele!" },
    { q: "Qual marca de raquete o João usa?", opts: ["Wilson", "Babolat", "Head", "Yonex"], answer: 3, points: 10, fun: "Ele usa a mesma marca que Djokovic!" },
    { q: "Em que ano o João alcançou o nº1 do ranking juvenil?", opts: ["2021", "2022", "2023", "2024"], answer: 2, points: 10, fun: "Com apenas 17 anos, antes de virar profissional!" },
  ];
  var _shuf = useState(function() { var arr = allQuestions.slice(); for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; } return arr; });
  var questions = _shuf[0];
  var totalPoints = questions.reduce(function(sum, q) { return sum + q.points; }, 0);
  var handleAnswer = function(idx) { if (revealed) return; setSelected(idx); setRevealed(true); if (idx === questions[currentQ].answer) setScore(score + questions[currentQ].points); };
  var handleNext = function() {
    if (currentQ < questions.length - 1) { setCurrentQ(currentQ + 1); setSelected(null); setRevealed(false); }
    else {
      setDone(true);
      fetch("/api/quiz-count", { method: "POST" }).then(function(r) { return r.json(); }).then(function(d) { if (d && typeof d.count === "number") setQuizCount(d.count); }).catch(function() {});
    }
  };
  var getResultMsg = function() { var pct = Math.round((score / totalPoints) * 100); if (pct === 100) return { emoji: "🏆", msg: "Perfeito! Verdadeiro fã!" }; if (pct >= 80) return { emoji: "🔥", msg: "Impressionante!" }; if (pct >= 60) return { emoji: "🎾", msg: "Bom, você acompanha!" }; return { emoji: "📚", msg: "Continue acompanhando!" }; };
  if (!started) return (
    <div style={{ background: BG_ALT, borderRadius: 10, padding: "18px 16px", margin: "4px 0", cursor: "pointer", border: "1px solid " + BORDER }} onClick={function() { setStarted(true); }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: SANS, background: "#b8860b", padding: "2px 6px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>Quiz</span>
      </div>
      <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>Quanto você conhece o João?</p>
      <p style={{ margin: "0 0 12px", fontSize: 11, color: SUB, fontFamily: SANS }}>{questions.length} perguntas · {totalPoints} pontos{quizCount ? " · " + quizCount + " já jogaram" : ""}</p>
      <div style={{ background: GREEN, padding: "9px 20px", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: SANS, textAlign: "center" }}>Jogar</div>
    </div>
  );
  if (done) {
    var result = getResultMsg();
    return (
      <div style={{ background: BG_ALT, borderRadius: 10, padding: "18px 16px", margin: "4px 0", textAlign: "center", border: "1px solid " + BORDER }}>
        <span style={{ fontSize: 40 }}>{result.emoji}</span>
        <h3 style={{ margin: "8px 0 4px", fontSize: 20, fontWeight: 800, color: TEXT, fontFamily: SERIF }}>{score}/{totalPoints} pontos</h3>
        <p style={{ margin: "0 0 4px", fontSize: 13, color: SUB, fontFamily: SANS }}>{result.msg}</p>
        {quizCount && <p style={{ margin: "0 0 12px", fontSize: 10, color: DIM, fontFamily: SANS }}>{quizCount} pessoas já jogaram o quiz</p>}
        <button onClick={function() { setCurrentQ(0); setScore(0); setSelected(null); setDone(false); setStarted(false); setRevealed(false); }} style={{ padding: "10px 20px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>Jogar de novo</button>
      </div>
    );
  }
  var q = questions[currentQ];
  return (
    <div style={{ background: BG_ALT, borderRadius: 10, padding: "18px 16px", margin: "4px 0", border: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: SANS, background: "#b8860b", padding: "2px 6px", borderRadius: 999 }}>Pergunta {currentQ + 1}/{questions.length}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, fontFamily: SANS }}>{score} pts</span>
      </div>
      <div style={{ height: 3, background: "#e8e8e8", borderRadius: 2, marginBottom: 14 }}><div style={{ height: 3, background: GREEN, borderRadius: 2, width: ((currentQ + 1) / questions.length * 100) + "%", transition: "width 0.3s" }} /></div>
      <p style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: TEXT, fontFamily: SERIF, lineHeight: 1.4 }}>{q.q}</p>
      <span style={{ fontSize: 11, color: "#b8860b", fontFamily: SANS, fontWeight: 600 }}>{q.points} pontos</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
        {q.opts.map(function(opt, idx) {
          var isCorrect = idx === q.answer; var isSelected = idx === selected;
          var bg = BG_ALT; var borderColor = BORDER; var textColor = TEXT;
          if (revealed) { if (isCorrect) { bg = GREEN + "20"; borderColor = GREEN + "40"; textColor = GREEN; } else if (isSelected) { bg = RED + "20"; borderColor = RED + "40"; textColor = RED; } else { bg = "#f5f5f5"; textColor = DIM; } }
          return (<button key={idx} onClick={function() { handleAnswer(idx); }} disabled={revealed} style={{ padding: "12px 14px", background: bg, border: "1px solid " + borderColor, borderRadius: 10, cursor: revealed ? "default" : "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}><span style={{ width: 24, height: 24, borderRadius: "50%", background: revealed && isCorrect ? GREEN : (revealed && isSelected ? RED : BORDER), border: "1px solid " + (revealed && isCorrect ? GREEN : (revealed && isSelected ? RED : BORDER)), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: revealed && (isCorrect || isSelected) ? "#fff" : DIM, fontFamily: SANS, flexShrink: 0 }}>{revealed && isCorrect ? "✓" : (revealed && isSelected ? "✗" : String.fromCharCode(65 + idx))}</span><span style={{ fontSize: 14, fontWeight: 600, color: textColor, fontFamily: SANS }}>{opt}</span></button>);
        })}
      </div>
      {revealed && (<div style={{ marginTop: 12 }}><div style={{ padding: "10px 14px", background: "#FFFBEB", borderRadius: 10, border: "1px solid #FDE68A", marginBottom: 10 }}><p style={{ margin: 0, fontSize: 12, color: "#92400E", fontFamily: SANS }}>💡 {q.fun}</p></div><button onClick={handleNext} style={{ width: "100%", padding: "12px", background: GREEN, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: SANS }}>{currentQ < questions.length - 1 ? "Próxima →" : "Ver resultado 🏆"}</button></div>)}
    </div>
  );
};

// ===== MATCH PREDICTION =====
export var MatchPrediction = function(props) {
  var match = props.match;
  if (!match || !match.date) return null;
  var matchDate = new Date(match.date); var now = new Date();
  if (now > matchDate) return null;
  var oppName = match.opponent_name || "A definir";
  var oppShort = oppName.length > 12 ? oppName.split(" ").pop() : oppName;
  var matchId = (match.event_id || match.tournament_name || "match").toString().replace(/[^a-zA-Z0-9]/g, "_");
  var _p = useState(function() { try { return localStorage.getItem("fn_pred_" + matchId); } catch(e) { return null; } });
  var prediction = _p[0]; var setPrediction = _p[1];
  var _res = useState(null); var predResults = _res[0]; var setPredResults = _res[1];
  useEffect(function() {
    fetch("/api/predict?matchId=" + matchId).then(function(r) { return r.json(); }).then(function(d) { if (d && d.total > 0) setPredResults(d); }).catch(function() {});
  }, []);
  var options = [
    { label: "Fonseca 2x0", score: "fonseca_2x0", winner: "joao" },
    { label: "Fonseca 2x1", score: "fonseca_2x1", winner: "joao" },
    { label: oppShort + " 2x1", score: "opp_2x1", winner: "opp" },
    { label: oppShort + " 2x0", score: "opp_2x0", winner: "opp" },
  ];
  var handlePredict = function(opt) {
    if (prediction) return;
    setPrediction(opt.score);
    try { localStorage.setItem("fn_pred_" + matchId, opt.score); } catch(e) {}
    fetch("/api/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score: opt.score, matchId: matchId }) })
      .then(function(r) { return r.json(); })
      .then(function(d) { if (d && d.total > 0) setPredResults(d); })
      .catch(function() {});
  };
  return (
    <div style={{ background: BG_ALT, borderRadius: 10, padding: "18px 16px", margin: "4px 0", border: "1px solid " + BORDER }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: SANS, background: "#7C3AED", padding: "2px 6px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.06em" }}>Palpite</span>
      </div>
      {!prediction ? (
        <>
          <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>Qual será o placar?</p>
          <p style={{ margin: "0 0 10px", fontSize: 11, color: SUB, fontFamily: SANS }}>Fonseca vs {oppName}{match.round ? " · " + match.round : ""}{predResults && predResults.total ? " · " + predResults.total + " palpites" : ""}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {options.map(function(opt) { var isJ = opt.winner === "joao"; return (<button key={opt.score} onClick={function() { handlePredict(opt); }} style={{ padding: "7px 4px", background: isJ ? "rgba(0,168,89,0.08)" : "rgba(192,57,43,0.08)", border: "1px solid " + (isJ ? "rgba(0,168,89,0.2)" : "rgba(192,57,43,0.2)"), borderRadius: 8, cursor: "pointer", textAlign: "center" }}><span style={{ fontSize: 13, fontWeight: 700, color: isJ ? GREEN : RED, fontFamily: SANS, display: "block" }}>{opt.score.includes("2x0") ? "2x0" : "2x1"}</span><span style={{ fontSize: 9, color: DIM, fontFamily: SANS }}>{isJ ? "Fonseca" : oppShort}</span></button>); })}
          </div>
        </>
      ) : (
        <div>
          <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: TEXT, fontFamily: SERIF }}>Palpites da comunidade</p>
          {options.map(function(opt) {
            var pct = predResults && predResults.predictions && predResults.predictions[opt.score] ? predResults.predictions[opt.score].pct : 0;
            var isSelected = prediction === opt.score;
            var isJ = opt.winner === "joao";
            return (
              <div key={opt.score} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: isSelected ? 700 : 500, color: isSelected ? (isJ ? GREEN : RED) : SUB, fontFamily: SANS }}>{opt.label}{isSelected ? " ✓" : ""}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: DIM, fontFamily: SANS }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: "#e8e8e8", borderRadius: 2 }}><div style={{ height: 4, background: isJ ? GREEN : RED, borderRadius: 2, width: Math.max(pct, 2) + "%", opacity: isSelected ? 1 : 0.4, transition: "width 0.6s ease" }} /></div>
              </div>
            );
          })}
          {predResults && predResults.total && <p style={{ margin: "6px 0 0", fontSize: 10, color: DIM, fontFamily: SANS, textAlign: "center" }}>{predResults.total} palpites</p>}
        </div>
      )}
    </div>
  );
};

// ===== NEWS CARD =====
var NewsCard = function(props) {
  var item = props.item; var index = props.index; var allLikes = props.allLikes || {}; var noBorder = props.noBorder;
  var _s = useState(false); var h = _s[0]; var setH = _s[1];
  var _i = useState(false); var imgErr = _i[0]; var setImgErr = _i[1];
  var hasImg = item.image && !imgErr;
  var likeId = (item.title || "").substring(0, 40).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  var initialLikes = allLikes[likeId] || { likes: 0, dislikes: 0 };
  var _lk = useState(initialLikes); var rx = _lk[0]; var setRx = _lk[1];
  var _voted = useState(function() { try { return localStorage.getItem("fn_v_" + likeId); } catch(e) { return null; } });
  var voted = _voted[0]; var setVoted = _voted[1];
  useEffect(function() { var fresh = allLikes[likeId]; if (fresh && typeof fresh.likes === "number") setRx(fresh); }, [allLikes[likeId]]);
  var handleRx = function(type, e) { e.preventDefault(); e.stopPropagation(); if (voted) return; var action = type === "l" ? "like" : "dislike"; fetch("/api/likes?id=" + likeId + "&action=" + action, { method: "POST" }).then(function(r) { return r.json(); }).then(function(d) { if (d && typeof d.likes === "number") setRx(d); }).catch(function() {}); setVoted(type); try { localStorage.setItem("fn_v_" + likeId, type); } catch(e) {} };
  var handleSh = function(e) { e.preventDefault(); e.stopPropagation(); if (navigator.share) { navigator.share({ title: item.title, url: item.url || "https://fonsecanews.com.br" }).catch(function() {}); } };
  var catColor = catColors[item.category] || catColors["Notícia"];
  var hasUrl = item.url && item.url.startsWith("http");
  var cleanTitle = item.source && item.title ? item.title.replace(" - " + item.source, "").replace(" | " + item.source, "").replace(" · " + item.source, "") : item.title;
  return (
    <article onClick={function() { if (hasUrl) window.open(item.url, "_blank", "noopener,noreferrer"); }} onMouseEnter={function() { setH(true); }} onMouseLeave={function() { setH(false); }}
      style={{ padding: "20px 0", borderBottom: noBorder ? "none" : "1px solid " + BORDER, cursor: "pointer", animation: "fadeIn 0.35s ease forwards", animationDelay: (index * 0.04) + "s", opacity: 0 }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: catColor, fontFamily: SANS }}>{item.category}</span>
            <span style={{ fontSize: 11, color: DIM, fontFamily: SANS }}>{item.source}</span>
            <span style={{ fontSize: 11, color: DIM, fontFamily: SANS, marginLeft: "auto" }}>{formatTimeAgo(item.date)}</span>
          </div>
          <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: h ? "#007A3D" : TEXT, fontFamily: SERIF, lineHeight: 1.35, letterSpacing: "-0.01em", transition: "color 0.15s" }}>{cleanTitle}</h3>
          {item.summary && <p style={{ margin: "0 0 6px", fontSize: 14, color: SUB, fontFamily: SANS, lineHeight: 1.6 }}>{item.summary}</p>}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
            <button onClick={function(e) { handleRx("l", e); }} style={{ background: "none", border: "none", cursor: voted ? "default" : "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, opacity: voted && voted !== "l" ? 0.2 : (voted === "l" ? 1 : 0.35) }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={voted === "l" ? GREEN : "none"} stroke={voted === "l" ? GREEN : DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
              {rx.likes > 0 && <span style={{ fontSize: 10, color: voted === "l" ? GREEN : DIM, fontWeight: 600, fontFamily: SANS }}>{rx.likes}</span>}
            </button>
            <button onClick={function(e) { handleRx("d", e); }} style={{ background: "none", border: "none", cursor: voted ? "default" : "pointer", display: "flex", alignItems: "center", gap: 4, padding: 0, opacity: voted && voted !== "d" ? 0.2 : (voted === "d" ? 1 : 0.35) }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill={voted === "d" ? RED : "none"} stroke={voted === "d" ? RED : DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10zM17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
              {rx.dislikes > 0 && <span style={{ fontSize: 10, color: voted === "d" ? RED : DIM, fontWeight: 600, fontFamily: SANS }}>{rx.dislikes}</span>}
            </button>
            <button onClick={handleSh} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: "auto", opacity: 0.3 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={DIM} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
          </div>
        </div>
        {hasImg && <img src={item.image} alt="" onError={function() { setImgErr(true); }} style={{ width: 72, height: 72, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: "#f0f0f0" }} loading="lazy" />}
      </div>
    </article>
  );
};

// ===== BUILD FEED =====
export var buildFeed = function(newsItems, allLikes, nextMatch) {
  var elements = [];
  var interactions = [
    nextMatch ? <MatchPrediction key="prediction" match={nextMatch} /> : null,
    <QuizGame key="quiz" />,
    <DailyPoll key="poll" />,
  ].filter(Boolean);
  var interactionIdx = 0;
  newsItems.forEach(function(item, i) {
    var isLastBeforeInteraction = (i + 1) % 4 === 0 && interactionIdx < interactions.length;
    elements.push(<NewsCard key={"news-" + i} item={item} index={i} allLikes={allLikes} noBorder={isLastBeforeInteraction} />);
    if (isLastBeforeInteraction) {
      elements.push(interactions[interactionIdx]);
      interactionIdx++;
    }
  });
  while (interactionIdx < interactions.length) {
    elements.push(interactions[interactionIdx]);
    interactionIdx++;
  }
  return elements;
};

export default NewsCard;
