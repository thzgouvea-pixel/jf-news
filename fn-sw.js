// public/fn-sw.js
// Fonseca News Service Worker — Web Push nativo (sem Firebase)
// Handles: push events (show notification) and notification clicks (open site)

self.addEventListener("install", function(event) {
  self.skipWaiting();
});

self.addEventListener("activate", function(event) {
  event.waitUntil(self.clients.claim());
});

// Basic offline handler (preserva comportamento do SW anterior)
self.addEventListener("fetch", function(event) {
  // Deixa o browser lidar normal; se offline, retorna resposta simples
  event.respondWith(
    fetch(event.request).catch(function() {
      return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
    })
  );
});

// ===== PUSH: mostra notificacao quando chega =====
self.addEventListener("push", function(event) {
  var data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Fonseca News", body: event.data ? event.data.text() : "" };
  }

  var title = data.title || "Fonseca News";
  var options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: "/icon-192.png",
    tag: data.tag || "fn-default",  // agrupa notificacoes do mesmo tipo (sobrescreve antigas)
    renotify: true,
    data: {
      url: data.url || "https://fonsecanews.com.br"
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ===== CLICK: abre o site no link =====
self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  var targetUrl = (event.notification.data && event.notification.data.url) || "https://fonsecanews.com.br";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      // Se ja tem uma aba do site aberta, foca nela
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf("fonsecanews") !== -1 && "focus" in client) {
          if ("navigate" in client) {
            try { client.navigate(targetUrl); } catch (e) {}
          }
          return client.focus();
        }
      }
      // Senao, abre uma nova
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
