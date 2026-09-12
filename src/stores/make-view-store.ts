import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 「看哪一種」的 store 工廠。
 *
 * 規則各頁都一樣：網址說了算，沒指定時沿用上次的選擇，選了就記住。分頁自己
 * 寫一份的下場是行為會分岔——書籍頁記得住、書寫頁重整就回預設，同一顆選單
 * 在不同頁表現不同。
 *
 * 網址那一半在 useUrlParams，這裡只管記憶。
 */
export function makeViewStore<T extends string>(name: string, modes: readonly T[], fallback: T) {
  const isMode = (value: string | null): value is T => modes.includes(value as T);

  const useStore = create<{ view: T; setView: (view: T) => void }>()(
    persist(
      (set) => ({
        view: fallback,
        setView: (view) => set({ view }),
      }),
      {
        name,
        version: 1,
        // 存過的值可能是已經刪掉的看法，認不得就退回預設，不要讓畫面一開就空白
        migrate: (state) => {
          const saved = state as { view: T };
          return { ...saved, view: isMode(saved?.view) ? saved.view : fallback };
        },
      },
    ),
  );

  return { useStore, isMode, modes, fallback };
}
