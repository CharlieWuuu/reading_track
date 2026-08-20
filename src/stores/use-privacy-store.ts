import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * 私人項目的解鎖狀態。
 *
 * 權杖放 sessionStorage 而不是 localStorage：關掉分頁就自動鎖回去。在公司開一下
 * 又忘記鎖，是這個功能最可能出包的方式，所以預設就讓它短命。
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
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
