import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchButton } from "./search-button";

const meta = {
  component: SearchButton,
  args: { value: "", onChange: () => {} },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return (
      <div className="flex w-96 items-center gap-2">
        <SearchButton {...args} value={value} onChange={setValue} />
      </div>
    );
  },
} satisfies Meta<typeof SearchButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 收起來只是一顆放大鏡，點了才展開 */
export const Collapsed: Story = {};

/** 有搜尋詞時一定是展開的，否則看不出清單為什麼少一半 */
export const WithQuery: Story = {
  args: { value: "馬克思" },
};

export const CustomPlaceholder: Story = {
  args: { placeholder: "搜尋書名或作者" },
};
