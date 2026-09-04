import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Field } from "./field";

const meta = {
  component: Field,
  args: { label: "書名", value: "", onChange: () => {} },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="w-80">
        <Field {...args} value={value} onChange={setValue} />
      </div>
    );
  },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Filled: Story = {
  args: { value: "資本論" },
};

/** hint 是「這一欄可以填什麼」，不是錯誤訊息——目前沒有錯誤狀態 */
export const WithHint: Story = {
  args: { label: "頁數", hint: "留空代表還沒讀完", value: "" },
};

export const DateInput: Story = {
  args: { label: "讀完日期", type: "date", value: "2026-08-19" },
};
