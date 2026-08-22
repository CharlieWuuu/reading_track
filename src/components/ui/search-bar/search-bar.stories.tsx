import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchBar } from "./search-bar";

const meta = {
  component: SearchBar,
  args: { value: "", onChange: () => {} },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex w-96 items-center gap-2">
        <SearchBar {...args} value={value} onChange={setValue} />
      </div>
    );
  },
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 空的時候右邊沒有叉：沒東西可清 */
export const Empty: Story = {};

/** 有搜尋詞才出現清除鍵 */
export const WithQuery: Story = {
  args: { value: "馬克思" },
};

export const CustomPlaceholder: Story = {
  args: { placeholder: "搜尋書名或作者" },
};
