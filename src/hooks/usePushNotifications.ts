import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  isSubscribed: boolean;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationPermissionState>({
    permission: "default",
    isSupported: false,
    isSubscribed: false,
  });
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const isSupported = "Notification" in window && "serviceWorker" in navigator;
    
    setState((prev) => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : "denied",
    }));

    if (isSupported) {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", reg);
      setRegistration(reg);
      
      // Check if already subscribed
      const subscription = await reg.pushManager.getSubscription();
      setState((prev) => ({
        ...prev,
        isSubscribed: !!subscription,
      }));
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  };

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast.error("Push notifications are not supported in this browser");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      
      if (permission === "granted") {
        toast.success("Notifications enabled!");
        return true;
      } else if (permission === "denied") {
        toast.error("Notification permission denied");
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      toast.error("Failed to request notification permission");
      return false;
    }
  }, [state.isSupported]);

  const sendLocalNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!state.isSupported || state.permission !== "granted") {
        console.log("Cannot send notification - permission not granted");
        return;
      }

      if (registration) {
        registration.showNotification(title, {
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          ...options,
        });
      } else {
        new Notification(title, {
          icon: "/favicon.ico",
          ...options,
        });
      }
    },
    [state.isSupported, state.permission, registration]
  );

  const subscribeToNotifications = useCallback(async () => {
    if (!registration) {
      toast.error("Service worker not registered");
      return null;
    }

    try {
      // For demo purposes, we'll use a placeholder VAPID key
      // In production, you'd get this from your server
      const vapidKey = urlBase64ToUint8Array(
        "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
      );
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey as BufferSource,
      });

      setState((prev) => ({ ...prev, isSubscribed: true }));
      console.log("Push subscription:", subscription);
      
      // Here you would send the subscription to your server
      // await sendSubscriptionToServer(subscription);
      
      toast.success("Subscribed to push notifications");
      return subscription;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      toast.error("Failed to subscribe to push notifications");
      return null;
    }
  }, [registration]);

  const unsubscribeFromNotifications = useCallback(async () => {
    if (!registration) return;

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        setState((prev) => ({ ...prev, isSubscribed: false }));
        toast.success("Unsubscribed from push notifications");
      }
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    }
  }, [registration]);

  return {
    ...state,
    requestPermission,
    sendLocalNotification,
    subscribeToNotifications,
    unsubscribeFromNotifications,
  };
};

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
