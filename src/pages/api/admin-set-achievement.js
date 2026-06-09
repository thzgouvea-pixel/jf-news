// /api/admin-set-achievement — edita/adiciona uma conquista manualmente.
// Auth: PUSH_SECRET. Uso comum: adicionar 'note' (curadoria) numa entrada
// que o cron criou automaticamente.
//
// EDITAR nota: ?secret=...&id=auto:999&note=1º brasileiro a ganhar Halle
// ADICIONAR manual: ?secret=...&id=manual:slug&t=Titulo&d=Mes 2026&det=...&category=Singles&dateISO=2026-06-21[&note=...]
// REMOVER: ?secret=...&id=manual:slug&action=delete

import { kv } from "@vercel/kv";

function clean(v, max) {
  if (v == null) return "";
  return String(v).substring(0, max || 200).replace(/[<>]/g, "");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  var secret = req.query.secret || (req.body && req.body.secret);
  var expected = process.env.PUSH_SECRET || process.env.CRON_SECRET;
  if (!expected || secret !== expected) return res.status(401).json({ error: "unauthorized" });

  var id = clean(req.query.id, 80);
  if (!id) return res.status(400).json({ error: "missing id" });

  try {
    var raw = await kv.get("fn:achievements");
    var list = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : [];
    if (!Array.isArray(list)) list = [];

    if (clean(req.query.action, 10) === "delete") {
      var before = list.length;
      list = list.filter(function (a) { return a && a.id !== id; });
      await kv.set("fn:achievements", JSON.stringify(list));
      return res.status(200).json({ ok: true, removed: before - list.length, total: list.length });
    }

    var idx = -1;
    for (var i = 0; i < list.length; i++) { if (list[i] && list[i].id === id) { idx = i; break; } }

    var fields = {};
    ["t", "d", "det", "note", "category", "dateISO"].forEach(function (k) {
      if (req.query[k] !== undefined) fields[k] = clean(req.query[k], 200);
    });
    // se note=="" (string vazia), remove a nota
    if (req.query.note === "") fields.note = null;

    if (idx === -1) {
      // adicionando nova manual
      if (!fields.t) return res.status(400).json({ error: "missing t (titulo)" });
      var entry = Object.assign({
        id: id, t: "", d: "", det: "", note: null,
        category: "Singles", dateISO: null, source: "manual",
      }, fields);
      list.push(entry);
      await kv.set("fn:achievements", JSON.stringify(list));
      return res.status(200).json({ ok: true, added: entry, total: list.length });
    }

    // editando
    list[idx] = Object.assign({}, list[idx], fields);
    await kv.set("fn:achievements", JSON.stringify(list));
    return res.status(200).json({ ok: true, updated: list[idx], total: list.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
