export const requestNotificationPermission = async () => {
  if (typeof window === "undefined") {
    return;
  }

  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return;
  }

  if (
    Notification.permission !== "granted" &&
    Notification.permission !== "denied"
  ) {
    try {
      await Notification.requestPermission();
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  }
};
