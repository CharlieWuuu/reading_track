import { create } from "zustand";
import { FormTab } from "@/utils/record-form";

/**
 * 編輯表單看「內容」還是「屬性」。
 *
 * 放 store 不放表單自己：手機的切換鈕在 PageHeader，跟 ModuleForm 是兄弟，
 * 拿不到對方的 state。不 persist——這是「現在在看哪一頁」，下次進表單該從內容開始。
 */
interface FormTabStore {
  tab: FormTab;
  setTab: (tab: FormTab) => void;
}

export const useFormTabStore = create<FormTabStore>((set) => ({
  tab: "content",
  setTab: (tab) => set({ tab }),
}));
