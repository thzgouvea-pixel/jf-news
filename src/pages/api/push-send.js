// src/pages/api/push-send.js
// Sends push notification to all subscribed devices via FCM HTTP v1 API
// POST: { title, body, url } + secret header for auth
// Called by cron-update.js when ranking changes, next match defined, etc.
// Uses Google OAuth2 to get access token from service account credentials.

import { kv } from "@vercel/kv";

// Get access token from service account for FCM v1 API
async function getAccessToken() {
  var sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  if (!sa.private_key || !sa.client_email) return null;

  var now = Math.floor(Date.now() / 1000);
  
  // Build JWT header and claim
  var header = { alg: "RS256", typ: "JWT" };
  var claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };

  // Base64url encode
  function b64url(obj) {
    return Buffer.from(JSON.stringify(obj)).toString("base64url");
  }

  var unsignedToken = b64url(header) + "." + b64url(claim);

  // Sign with RSA-SHA256
  var crypto = require("crypto");
  var sign = crypto.createSign("RSA-SHA256");
  sign.update(unsignedToken);
  var signature = sign.sign(sa.private_key, "base64url");

  var jwt = unsignedToken + "." + signature;

  // Exchange JWT for access token
  var res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwt
  });

  var data = await res.json();
  return data.access_token || null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Cache-Control", "s-maxage=300");
    return res.status(405).json({ error: "POST only" });
  }

  // Simple auth: check secret header
  var secret = req.headers["x-push-secret"] || req.query.secret;
  if (secret !== process.env.PUSH_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    var body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    var title = body.title || "Fonseca News";
    var msgBody = body.body || "";
    var url = body.url || "https://fonsecanews.com.br";

    // Get all tokens
    var tokens = (await kv.get("push:tokens")) || [];
    if (tokens.length === 0) {
      return res.status(200).json({ sent: 0, message: "No subscribers" });
    }

    // Get FCM access token
    var accessToken = await getAccessToken();
    if (!accessToken) {
      return res.status(500).json({ error: "Failed to get FCM access token" });
    }

    var projectId = "fonsecanews-a8dd6";
    var fcmUrl = "https://fcm.googleapis.com/v1/projects/" + projectId + "/messages:send";

    var sent = 0;
    var failed = 0;
    var invalidTokens = [];

    // Send to each token
    for (var i = 0; i < tokens.length; i++) {
      try {
        var fcmRes = await fetch(fcmUrl, {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + accessToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: {
              token: tokens[i],
              notification: {
                title: title,
                body: msgBody
              },
              webpush: {
                fcm_options: {
                  link: url
                }
              }
            }
          })
        });

        if (fcmRes.ok) {
          sent++;
        } else {
          var errData = await fcmRes.json().catch(function() { return {}; });
          // If token is invalid/expired, mark for removal
          if (fcmRes.status === 404 || fcmRes.status === 410 ||
              (errData.error && errData.error.details && 
               errData.error.details.some(function(d) { return d.errorCode === "UNREGISTERED"; }))) {
            invalidTokens.push(tokens[i]);
          }
          failed++;
        }
      } catch (e) {
        failed++;
      }
    }

    // Clean up invalid tokens
    if (invalidTokens.length > 0) {
      var cleanTokens = tokens.filter(function(t) { return !invalidTokens.includes(t); });
      await kv.set("push:tokens", cleanTokens);
    }

    return res.status(200).json({
      sent: sent,
      failed: failed,
      cleaned: invalidTokens.length,
      total: tokens.length
    });

  } catch (error) {
    console.error("[push-send] Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
