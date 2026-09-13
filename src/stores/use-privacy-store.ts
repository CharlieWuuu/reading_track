import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * 私人項目的解鎖狀態。
 *
 * 權杖放 localStorage：手機上切出去再回來就是關掉分頁，sessionStorage 等於
 * 每次都要重打一次密碼，煩到讓人乾脆不用這個功能。要鎖回去就按上鎖。
 */
interface PrivacyStore {
  /** 解鎖權杖；null 代表鎖著。讀清單時帶著它，伺服器才會把私人的那幾列一起送來 */
  token: string | null;
  unlock: (token: string) => void;
  lock: () => void;
}

export const usePrivacyStore = create<PrivacyStore>()(
  persist(
    (set) => ({
      token: null,
      unlock: (token) => set({ token }),
      lock: () => set({ token: null }),
    }),
    {
      name: "reading-track-privacy",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
