// ===== FONSECA NEWS — REFRESH OPPONENT v1 =====
// Wrapper leve que conserta o gap do cron-update quando o proxy SofaScore
// retorna match com opponent placeholder ("R64P19", "Q1", etc).
//
// PROBLEMA: cron-update.js so chama o scrape fallback (API publica) quando
// `results.upcoming.length === 0`. Se o proxy ja entregou o match com placeholder,
// o array tem 1 item, o fallback nao roda, e o opponent fica "A definir" travado
// ate o proxy pago atualizar (pode levar horas).
//
// SOLUCAO: a cada 5min, le fn:nextMatch do KV. Se opponent_name === "A definir"
// E o jogo esta em <72h, faz fetch DIRETO na API publica
// https://api.sofascore.com/api/v1/event/{id} (que nao filtra placeholders).
// Se vier opponent real, atualiza fn:nextMatch.
//
// CUSTOS:
//  - 99% das execucoes: 1 KV read + early-return (~50ms, zero RapidAPI)
//  - Em janela com placeholder: 1 KV read + 1 fetch publica + 1 KV write (~500ms)
//  - Zero invocacoes ao proxy pago RapidAPI

import { kv } from "@vercel/kv";

var FONSECA_TEAM_ID = 403869;
var T7 = 604800; // 7 dias em segundos

function log(msg) { console.log("[refresh-opp] " + msg); }

function parseKV(raw) {
  if (!raw) return null;
  try { return typeof raw === "string" ? JSON.parse(raw) : raw; }
  catch (e) { return null; }
}

// Detecta placeholder do SofaScore: R64P19, R32P3, Q1, Q2, WC, LL
function isPlaceholder(name) {
  if (!name) return true;
  if (name === "A definir") return true;
  if (/^(R\d+P\d+|Q\d+|WC|LL)$/i.test(name)) return true;
  return false;
}

export default async function handler(req, res) {
  var start = Date.now();

  try {
    // ── PHASE 1: Le fn:nextMatch e decide se atua ──
    var nm = parseKV(await kv.get("fn:nextMatch"));

    if (!nm) {
      return res.status(200).json({
        ok: true, skipped: true, reason: "no-nextmatch-in-kv",
        elapsed: (Date.now() - start) + "ms"
      });
    }

    if (!nm.id) {
      return res.status(200).json({
        ok: true, skipped: true, reason: "no-match-id (placeholder vazio)",
        elapsed: (Date.now() - start) + "ms"
      });
    }

    // Ja tem opponent definido? Sai sem fazer nada.
    if (nm.opponent_name && nm.opponent_name !== "A definir" && !isPlaceholder(nm.opponent_name)) {
      return res.status(200).json({
        ok: true, skipped: true, reason: "already-defined: " + nm.opponent_name,
        elapsed: (Date.now() - start) + "ms"
      });
    }

    // Janela de tempo: so atua se faltam <=72h pro jogo (ou ja passou <=6h)
    if (nm.startTimestamp) {
      var hoursUntil = (nm.startTimestamp * 1000 - Date.now()) / 3600000;
      if (hoursUntil > 72) {
        return res.status(200).json({
          ok: true, skipped: true,
          reason: "too-far (" + Math.round(hoursUntil) + "h ate o jogo)",
          elapsed: (Date.now() - start) + "ms"
        });
      }
      if (hoursUntil < -6) {
        return res.status(200).json({
          ok: true, skipped: true,
          reason: "in-past (" + Math.round(hoursUntil) + "h atras)",
          elapsed: (Date.now() - start) + "ms"
        });
      }
    }

    log("placeholder detected: id=" + nm.id + ", buscando API publica...");

    // ── PHASE 2: Fetch direto na API publica do SofaScore ──
    // Mesmo padrao do scrapeNextMatchIdFromSofa() do cron-update (User-Agent Chrome real
    // pra contornar Cloudflare 403 quando vem de IP Vercel).
    var ctrl = new AbortController();
    var to = setTimeout(function() { ctrl.abort(); }, 10000);
    var ev = null;

    try {
      var r = await fetch("https://api.sofascore.com/api/v1/event/" + nm.id, {
        signal: ctrl.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          "Accept": "application/json",
        },
      });
      clearTimeout(to);
      if (!r.ok) {
        log("api publica status " + r.status);
        return res.status(200).json({
          ok: true, skipped: true, reason: "api-status-" + r.status,
          elapsed: (Date.now() - start) + "ms"
        });
      }
      var data = await r.json();
      ev = data.event || data;
    } catch (e) {
      clearTimeout(to);
      log("api fetch error: " + (e.name === "AbortError" ? "timeout 10s" : e.message));
      return res.status(200).json({
        ok: false, error: e.name === "AbortError" ? "timeout" : e.message,
        elapsed: (Date.now() - start) + "ms"
      });
    }

    if (!ev || !ev.homeTeam || !ev.awayTeam) {
      return res.status(200).json({
        ok: true, skipped: true, reason: "invalid-event-data",
        elapsed: (Date.now() - start) + "ms"
      });
    }

    // ── PHASE 3: Identifica oponente (lado oposto ao Fonseca) ──
    var fonsecaIsHome = ev.homeTeam.id === FONSECA_TEAM_ID;
    var fonsecaIsAway = ev.awayTeam.id === FONSECA_TEAM_ID;

    if (!fonsecaIsHome && !fonsecaIsAway) {
      log("WARNING: nem home nem away e o Fonseca (homeId=" + ev.homeTeam.id + " awayId=" + ev.awayTeam.id + ")");
      return res.status(200).json({
        ok: true, skipped: true, reason: "fonseca-not-in-match",
        elapsed: (Date.now() - start) + "ms"
      });
    }

    var oppTeam = fonsecaIsHome ? ev.awayTeam : ev.homeTeam;
    if (!oppTeam || !oppTeam.name) {
      return res.status(200).json({
        ok: true, skipped: true, reason: "no-opp-team-in-event",
        elapsed: (Date.now() - start) + "ms"
      });
    }

    var oppName = oppTeam.shortName || oppTeam.name;

    // Se a API publica TAMBEM retornou placeholder, sai sem atualizar
    // (significa que o sorteio ainda nao foi feito — ou Medjedovic vs Royer ainda nao terminou)
    if (isPlaceholder(oppName)) {
      log("api publica ainda retornou placeholder: " + oppName);
      return res.status(200).json({
        ok: true, skipped: true, reason: "still-placeholder-in-api: " + oppName,
        elapsed: (Date.now() - start) + "ms"
      });
    }

    // ── PHASE 4: Atualiza fn:nextMatch com opponent real ──
    var prevName = nm.opponent_name;
    nm.opponent_name = oppName;
    nm.opponent_id = oppTeam.id || null;
    if (oppTeam.country && oppTeam.country.name) {
      nm.opponent_country = oppTeam.country.name;
    }
    if (oppTeam.ranking && typeof oppTeam.ranking === "number") {
      nm.opponent_ranking = oppTeam.ranking;
    }
    nm.isFonsecaHome = fonsecaIsHome;

    // Atualiza startTimestamp tambem se a API publica trouxer um valor
    // (cobre caso de remarcacao que o proxy nao pegou)
    if (ev.startTimestamp && ev.startTimestamp !== nm.startTimestamp) {
      log("startTimestamp atualizado: " + nm.startTimestamp + " -> " + ev.startTimestamp);
      nm.startTimestamp = ev.startTimestamp;
      nm.date = new Date(ev.startTimestamp * 1000).toISOString();
    }

    await kv.set("fn:nextMatch", JSON.stringify(nm), { ex: T7 });

    log("UPDATED: '" + prevName + "' -> '" + oppName + "' (id=" + (oppTeam.id || "?") + ")");

    return res.status(200).json({
      ok: true,
      updated: true,
      previous: prevName,
      opponent: oppName,
      opponent_id: oppTeam.id || null,
      opponent_country: oppTeam.country ? oppTeam.country.name : null,
      opponent_ranking: oppTeam.ranking || null,
      elapsed: (Date.now() - start) + "ms"
    });

  } catch (e) {
    log("FATAL: " + e.message);
    return res.status(200).json({
      ok: false, error: e.message,
      elapsed: (Date.now() - start) + "ms"
    });
  }
}
