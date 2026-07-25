import { create } from "zustand";
import { persist } from "zustand/middleware";

interface InstapaperStore {
  token: string;
  tokenSecret: string;
  username: string;
  setAccess: (token: string, tokenSecret: string, username: string) => void;
  disconnect: () => void;
}

export const useInstapaperStore = create<InstapaperStore>()(
  persist(
    (set) => ({
      token: "",
      tokenSecret: "",
      username: "",
      setAccess: (token, tokenSecret, username) => set({ token, tokenSecret, username }),
      disconnect: () => set({ token: "", tokenSecret: "", username: "" }),
    }),
    { name: "reading-track-instapaper" }
  )
);
