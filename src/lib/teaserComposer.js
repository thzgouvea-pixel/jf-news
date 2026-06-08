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
// reason() opcional recebe o motivo da rejeicao (pra log/diagnostico).
// Exportado pra teste.
export function validateTeaser(txt, factsStr, reason) {
  var rej = function (r) { if (reason) reason(r); return null; };
  if (!txt) return rej("vazio");
  var len = txt.length;
  if (len < 45) return rej("curto:" + len);
  if (len > 275) return rej("longo:" + len);
  // NUMBER-GUARD: todo numero no texto precisa existir nos fatos (anti-invencao de
  // estatistica). EXCECAO: anos (4 digitos, 1900-2099) sao contexto seguro, nao stat.
  var factNums = numbersIn(factsStr);
  var txtNums = numbersIn(txt);
  for (var i = 0; i < txtNums.length; i++) {
    var nv = parseFloat(txtNums[i]);
    if (txtNums[i].length === 4 && nv >= 1900 && nv <= 2099) continue; // ano: ok
    if (factNums.indexOf(txtNums[i]) === -1) return rej("numero inventado:" + txtNums[i]);
  }
  // precisa terminar em pontuacao ou emoji (nao cortado no meio)
  var stripped = txt.replace(/\s+$/g, "");
  var chars = Array.from(stripped);
  var last = chars[chars.length - 1] || "";
  var endsPunct = /[.!?…)]/.test(last);
  var endsEmoji = (last.codePointAt(0) || 0) >= 0x2190; // setas, simbolos e emojis
  if (!endsPunct && !endsEmoji) return rej("fim:" + last);
  return txt;
}

// facts: { lines: ["fato 1", "fato 2", ...], hashtags: "#a #b" }
// fallback: texto template seguro usado se a IA falhar ou violar a trava.
// log: funcao opcional pra registrar o que a IA gerou e se passou (diagnostico).
// Retorna { text, source } — source = "ia" ou "template".
export async function composeTeaser(facts, fallback, log) {
  log = log || function () {};
  facts = facts || {};
  var lines = facts.lines || [];
  var factsStr = lines.join(" | ");
  var body = null, src = "template";
  try {
    var prompt =
      "Voce e o social media do Fonseca News (@JFonsecaNews), site de fas do tenista brasileiro Joao Fonseca.\n" +
      "Escreva UM tweet em portugues do Brasil que sirva de TEASER pra fazer a pessoa CLICAR e abrir o site.\n\n" +
      "FATOS (use SOMENTE estes — nao acrescente nenhum outro):\n- " + lines.join("\n- ") + "\n\n" +
      "COMO ESCREVER:\n" +
      "- Comece com energia. Crie CURIOSIDADE ou faca uma PERGUNTA instigante — nunca publique o dado seco.\n" +
      "- Tom de torcedor brasileiro empolgado, mas com classe e credibilidade.\n" +
      "- Destaque o que tem de mais interessante nos fatos (um nome forte, um numero marcante, uma virada).\n" +
      "- Termine puxando pro site, sem ser generico (ex: 'o raio-x ta la', 'veja como', 'detalhes no site').\n\n" +
      "REGRAS DURAS (credibilidade):\n" +
      "- Use SOMENTE numeros que aparecem nos fatos (anos como 2026 sao permitidos). NAO invente estatistica.\n" +
      "- NAO invente nome, recorde, placar ou qualquer afirmacao fora dos fatos.\n" +
      "- 1 ou 2 emojis (nunca no inicio). Maximo 215 caracteres. Sem hashtags. Sem aspas em volta.\n" +
      "- Responda APENAS o texto do tweet.";
    var raw = await geminiCompose(prompt);
    var why = "";
    body = validateTeaser(raw, factsStr, function (r) { why = r; });
    if (body) {
      src = "ia";
      log("teaser IA OK: " + body.replace(/\n+/g, " ").substring(0, 130));
    } else {
      log("teaser IA rejeitado (" + (why || "?") + ")" + (raw ? " raw='" + raw.replace(/\n+/g, " ").substring(0, 90) + "'" : " (vazio)") + " -> usa template");
    }
  } catch (e) { body = null; }
  if (!body) { body = fallback || null; src = "template"; }
  if (!body) return null;
  if (facts.hashtags && body.indexOf("#") === -1 && (body.length + facts.hashtags.length + 2) <= 275) {
    body = body + "\n\n" + facts.hashtags;
  }
  return { text: body, source: src };
}
