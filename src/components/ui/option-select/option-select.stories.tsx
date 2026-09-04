import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { OptionSelect } from "./option-select";

const OPTIONS = ["哲學", "歷史", "經濟", "小說", "科普"];
const COUNTS = new Map(OPTIONS.map((o, i) => [o, OPTIONS.length - i]));

const meta = {
  component: OptionSelect,
  args: { label: "領域", options: OPTIONS, value: "", onChange: () => {} },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="w-80">
        <OptionSelect {...args} value={value} onChange={setValue} />
      </div>
    );
  },
} satisfies Meta<typeof OptionSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Selected: Story = {
  args: { value: "哲學" },
};

/** 複選：多個值串在同一格裡，Sheet 那邊仍是一欄 */
export const Multiple: Story = {
  args: { label: "屬性", multiple: true, value: "哲學、歷史" },
};

/** 一行一筆的欄位（關鍵字）傳換行當分隔符 */
export const NewlineSeparated: Story = {
  args: { label: "關鍵字", multiple: true, separator: "\n", value: "馬克思\n剩餘價值" },
};

/** 給了 counts 就顯示使用次數，說明排序為什麼是這樣 */
export const WithCounts: Story = {
  args: { counts: COUNTS },
};

/** 已選的值上多一顆筆，點了跳去編主檔 */
export const Editable: Story = {
  args: { multiple: true, value: "哲學、歷史", onEditOption: () => {} },
};

export const CustomPlaceholder: Story = {
  args: { placeholder: "選一個領域" },
};
