// teaserComposer.js — transforma dados REAIS do site num tweet-teaser curioso
// (gancho/pergunta + chamada pro site), pra gerar clique e tráfego.
//
// REGRA DE CREDIBILIDADE (o ponto central): a IA recebe SÓ os fatos que extraímos
// do KV e é proibida de inventar. Garantia automática: NUMBER-GUARD — qualquer
// número que a IA escrever que não esteja nos fatos invalida o texto e cai no
// template seguro. Sem grounding (não busca a web), pra não puxar fato não verificado.

async function geminiCompose(prompt) {
  var gk = process.env.GEMINI_API_KEY;
  if (!gk) return null;
  var ctrl = new AbortController();
  var to = setTimeout(function () { ctrl.abort(); }, 12000);
  try {
    var r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + gk, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: ctrl.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // SEM tools/google_search de proposito: a IA so pode usar os fatos dados.
        generationConfig: { temperature: 0.8, maxOutputTokens: 500 },
      }),
    });
    clearTimeout(to);
    if (!r.ok) return null;
    var d = await r.json();
    var parts = d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts;
    if (!parts) return null;
    var txt = "";
    parts.forEach(function (p) { if (p.text && !p.thought) txt += p.text; });
    return txt.trim().replace(/^["']|["']$/g, "").trim();
  } catch (e) { clearTimeout(to); return null; }
}

function numbersIn(s) {
  var out = [];
  var m = String(s == null ? "" : s).match(/\d+(?:[.,]\d+)?/g);
  if (m) m.forEach(function (x) { out.push(x.replace(",", ".")); });
  return out;
}

// Valida o teaser da IA. Retorna o texto se OK, ou null (cai no fallback).
// Exportado pra teste.
export function validateTeaser(txt, factsStr) {
  if (!txt) return null;
  var len = txt.length;
  if (len < 50 || len > 270) return null;
  // NUMBER-GUARD: todo numero no texto precisa existir nos fatos (anti-invencao)
  var factNums = numbersIn(factsStr);
  var txtNums = numbersIn(txt);
  for (var i = 0; i < txtNums.length; i++) {
    if (factNums.indexOf(txtNums[i]) === -1) return null;
  }
  // precisa terminar em pontuacao ou emoji (nao cortado no meio)
  var stripped = txt.replace(/\s+$/g, "");
  var lastChar = stripped.charAt(stripped.length - 1);
  var endsPunct = /[.!?…)]/.test(lastChar);
  var tail = stripped.slice(-2);
  var endsEmoji = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️]/u.test(tail);
  if (!endsPunct && !endsEmoji) return null;
  return txt;
}

// facts: { lines: ["fato 1", "fato 2", ...], hashtags: "#a #b" }
// fallback: texto template seguro usado se a IA falhar ou violar a trava.
// Retorna o texto final (com hashtags anexadas se faltarem) ou null.
export async function composeTeaser(facts, fallback) {
  facts = facts || {};
  var lines = facts.lines || [];
  var factsStr = lines.join(" | ");
  var body = null;
  try {
    var prompt =
      "Voce e o social media do Fonseca News (@JFonsecaNews), site de fas do tenista brasileiro Joao Fonseca.\n" +
      "Escreva UM tweet em portugues do Brasil que funcione como TEASER pra levar a pessoa a abrir o site.\n\n" +
      "FATOS (use SOMENTE estes — nao acrescente nenhum outro):\n- " + lines.join("\n- ") + "\n\n" +
      "REGRAS OBRIGATORIAS:\n" +
      "- Gere CURIOSIDADE ou faca uma PERGUNTA. Nao publique o dado seco.\n" +
      "- Use SOMENTE os numeros que aparecem nos fatos. NAO escreva nenhum outro numero.\n" +
      "- NAO invente estatistica, nome, recorde, data ou qualquer afirmacao fora dos fatos.\n" +
      "- Tom de torcedor brasileiro com classe. 1 ou 2 emojis (nunca no inicio).\n" +
      "- Maximo 220 caracteres.\n" +
      "- Termine instigando a ver mais no site (ex: 'confira no site', 'veja o raio-x', 'detalhes la').\n" +
      "- Sem hashtags. Sem aspas em volta. Responda APENAS o texto do tweet.";
    var raw = await geminiCompose(prompt);
    body = validateTeaser(raw, factsStr);
  } catch (e) { body = null; }
  if (!body) body = fallback || null;
  if (!body) return null;
  if (facts.hashtags && body.indexOf("#") === -1 && (body.length + facts.hashtags.length + 2) <= 275) {
    body = body + "\n\n" + facts.hashtags;
  }
  return body;
}
