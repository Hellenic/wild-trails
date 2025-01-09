self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(showNotification(data.title, data.body, data.icon));
  }
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click received.");
  event.notification.close();
});

// Handle messages from the client
self.addEventListener("message", function (event) {
  if (event.data.type === "SEND_NOTIFICATION") {
    showNotification(event.data.title, event.data.body);
  }
});

function showNotification(title, body, icon = "/apple-touch-icon.png") {
  const options = {
    body,
    icon,
    badge: icon,
    vibrate: [100, 50, 100],
    data: {
      timeOfArrival: Date.now(),
    },
  };
  self.registration.showNotification(title, options);
}
