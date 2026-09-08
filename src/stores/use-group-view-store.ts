import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 堆概覽頁（紀錄／片段／專欄）的檢視方式。只有兩種——SPEC 定案卡片檢視已砍，
 * 表格上的多選是表格的一個開關，不是第三種檢視。
 *
 * 跟書籍那邊的 view store 分開：那邊是類型概覽（單一類型，可能有書封牆），
 * 這裡是堆概覽（混排多種類型），選項不一樣不共用同一個 key。
 */
export type GroupViewMode = "overview" | "table";

export const GROUP_VIEW_MODES: GroupViewMode[] = ["overview", "table"];

export function isGroupViewMode(value: string | null): value is GroupViewMode {
  return GROUP_VIEW_MODES.includes(value as GroupViewMode);
}

interface GroupViewStore {
  view: GroupViewMode;
  setView: (view: GroupViewMode) => void;
}

export const useGroupViewStore = create<GroupViewStore>()(
  persist(
    (set) => ({
      view: "overview",
      setView: (view) => set({ view }),
    }),
    { name: "archivum-group-view" },
  ),
);
