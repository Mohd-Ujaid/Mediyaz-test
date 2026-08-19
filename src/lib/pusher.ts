import PusherServer from "pusher";
import PusherClient from "pusher-js";

export const pusherServer =
  process.env.PUSHER_APP_ID && process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.PUSHER_SECRET
    ? new PusherServer({
        appId: process.env.PUSHER_APP_ID,
        key: process.env.NEXT_PUBLIC_PUSHER_KEY,
        secret: process.env.PUSHER_SECRET,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
        useTLS: true,
      })
    : { trigger: async () => {} }; // Dummy object for local dev without keys

// Client-side Pusher instance for listening to events
export const getPusherClient = () => {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_PUSHER_KEY) {
    return null;
  }
  return new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2",
  });
};
