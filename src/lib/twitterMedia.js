// twitterMedia.js — upload de imagem pra API do X (v1.1 media/upload), OAuth 1.0a.
// Retorna media_id_string pra anexar num tweet v2 (body.media.media_ids).
// Multipart: a assinatura OAuth cobre SOMENTE os parametros oauth_* (nao o corpo).

import crypto from "crypto";

function pe(str) {
  return encodeURIComponent(str)
    .replace(/!/g, "%21").replace(/\*/g, "%2A")
    .replace(/'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29");
}

export async function uploadMedia(buffer, mimeType) {
  var ck = process.env.TWITTER_CONSUMER_KEY;
  var cs = process.env.TWITTER_CONSUMER_SECRET;
  var at = process.env.TWITTER_ACCESS_TOKEN;
  var ats = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  if (!ck || !cs || !at || !ats) throw new Error("Missing Twitter credentials");

  var url = "https://upload.twitter.com/1.1/media/upload.json";
  var ts = Math.floor(Date.now() / 1000).toString();
  var nonce = crypto.randomBytes(16).toString("hex");
  var oauth = {
    oauth_consumer_key: ck, oauth_nonce: nonce, oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: ts, oauth_token: at, oauth_version: "1.0",
  };

  // base string: POST & url & params(oauth ordenados) — multipart NAO inclui o corpo
  var paramStr = Object.keys(oauth).sort().map(function (k) { return pe(k) + "=" + pe(oauth[k]); }).join("&");
  var base = "POST&" + pe(url) + "&" + pe(paramStr);
  var signingKey = pe(cs) + "&" + pe(ats);
  var sig = crypto.createHmac("sha1", signingKey).update(base).digest("base64");

  var all = Object.assign({}, oauth, { oauth_signature: sig });
  var header = "OAuth " + Object.keys(all).sort().map(function (k) { return pe(k) + '="' + pe(all[k]) + '"'; }).join(", ");

  // corpo multipart/form-data com o campo "media"
  var boundary = "----fnboundary" + crypto.randomBytes(8).toString("hex");
  var pre = Buffer.from("--" + boundary + "\r\n" +
    'Content-Disposition: form-data; name="media"\r\n' +
    "Content-Type: " + (mimeType || "image/png") + "\r\n\r\n");
  var tail = Buffer.from("\r\n--" + boundary + "--\r\n");
  var body = Buffer.concat([pre, buffer, tail]);

  var ctrl = new AbortController();
  var to = setTimeout(function () { ctrl.abort(); }, 15000);
  try {
    var res = await fetch(url, {
      method: "POST",
      headers: { Authorization: header, "Content-Type": "multipart/form-data; boundary=" + boundary },
      body: body, signal: ctrl.signal,
    });
    clearTimeout(to);
    var raw = await res.text();
    if (!res.ok) throw new Error("media upload " + res.status + ": " + raw.substring(0, 180));
    var d = JSON.parse(raw);
    return d.media_id_string || (d.media_id != null ? String(d.media_id) : null);
  } catch (e) { clearTimeout(to); throw e; }
}

export async function uploadMediaFromUrl(imageUrl) {
  var ctrl = new AbortController();
  var to = setTimeout(function () { ctrl.abort(); }, 15000);
  try {
    var r = await fetch(imageUrl, { signal: ctrl.signal });
    clearTimeout(to);
    if (!r.ok) throw new Error("image fetch " + r.status);
    var ab = await r.arrayBuffer();
    return await uploadMedia(Buffer.from(ab), "image/png");
  } catch (e) { clearTimeout(to); throw e; }
}
