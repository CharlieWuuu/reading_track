import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PagerButton } from "./pager-button";

const meta = {
  component: PagerButton,
  args: { direction: "prev", label: "上一頁", onClick: () => {} },
} satisfies Meta<typeof PagerButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Prev: Story = {};

export const Next: Story = {
  args: { direction: "next", label: "下一頁" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** 實際上永遠成對出現，兩顆之間夾著頁碼或月份 */
export const Pair: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <PagerButton {...args} direction="prev" label="上個月" />
      <span className="text-sm">2026 年 8 月</span>
      <PagerButton {...args} direction="next" label="下個月" disabled />
    </div>
  ),
};
