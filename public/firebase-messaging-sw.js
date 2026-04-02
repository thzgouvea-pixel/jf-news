// public/firebase-messaging-sw.js
// Service Worker for Firebase Cloud Messaging push notifications
// This file MUST be at the root of the public folder

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC-HLexrhKl8nzoSvzreVC5p5c3gSu7YBM",
  authDomain: "fonsecanews-a8dd6.firebaseapp.com",
  projectId: "fonsecanews-a8dd6",
  storageBucket: "fonsecanews-a8dd6.firebasestorage.app",
  messagingSenderId: "956348246783",
  appId: "1:956348246783:web:175dd2d3ff5586b05c3aca"
});

var messaging = firebase.messaging();

// Handle background messages (when site is not in focus)
messaging.onBackgroundMessage(function(payload) {
  var data = payload.notification || payload.data || {};
  var title = data.title || "Fonseca News";
  var options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.click_action || data.url || "https://fonsecanews.com.br" }
  };
  return self.registration.showNotification(title, options);
});

// Handle notification click — open the site
self.addEventListener("notificationclick", function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "https://fonsecanews.com.br";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        if (clientList[i].url.includes("fonsecanews") && "focus" in clientList[i]) {
          return clientList[i].focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
