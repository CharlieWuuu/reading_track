import { create } from "zustand";

/**
 * 表單「自動補齊」的橋：按鈕在 PageHeader，要填的值在 ModuleForm，兩邊是兄弟。
 *
 * 表單掛上時把 run 放進來，按鈕只管呼叫與顯示忙碌；沒登記 run 就是這個類型沒有補齊。
 * 不 persist——離開表單就清掉。
 */
interface AutofillStore {
  run: (() => Promise<void>) | null;
  busy: boolean;
  setRun: (run: (() => Promise<void>) | null) => void;
  setBusy: (busy: boolean) => void;
}

export const useAutofillStore = create<AutofillStore>((set) => ({
  run: null,
  busy: false,
  setRun: (run) => set({ run }),
  setBusy: (busy) => set({ busy }),
}));
