import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FormActions } from "./form-actions";

const meta = {
  component: FormActions,
  args: { onSave: () => {} },
} satisfies Meta<typeof FormActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 只有儲存：新增表單的樣子 */
export const SaveOnly: Story = {};

export const Saving: Story = {
  args: { saving: true },
};

export const WithCancel: Story = {
  args: { onCancel: () => {} },
};

/** 刪除一律靠最右邊，點了先問一次（點「刪除」看確認狀態） */
export const WithDelete: Story = {
  args: { onCancel: () => {}, onDelete: () => {} },
};

/** 這張表單特有的按鈕排在取消後面 */
export const WithExtra: Story = {
  args: {
    onCancel: () => {},
    onDelete: () => {},
    extra: (
      <button type="button" className="rounded border px-4 py-2 text-sm text-gray-600">
        查維基
      </button>
    ),
  },
};

export const WithError: Story = {
  args: { onCancel: () => {}, error: "寫進 Sheet 失敗，請再試一次" },
};

/** 沒給 onSave 就變成 type="submit"，交給外面的 form */
export const AsSubmit: Story = {
  args: { onSave: undefined, saveLabel: "新增" },
};
