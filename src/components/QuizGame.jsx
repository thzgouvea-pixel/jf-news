import { useState, useEffect } from 'react';
import { GREEN, RED, BG_ALT, TEXT, SUB, DIM, BORDER, SANS, SERIF } from '../lib/constants';

export default function QuizGame() {
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
}
