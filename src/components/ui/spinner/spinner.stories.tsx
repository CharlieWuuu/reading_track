import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Spinner } from "./spinner";

const meta = {
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 顏色跟著 currentColor 走，所以放進什麼就是什麼色 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-gray-400">
      <Spinner size={12} />
      <Spinner size={16} />
      <Spinner size={20} />
      <Spinner size={32} />
    </div>
  ),
};

/** 按鈕裡：白字的按鈕不用另外指定顏色 */
export const InButton: Story = {
  render: () => (
    <button className="rounded-control bg-control-bg text-control-ink flex items-center gap-2 px-4 py-2 text-sm">
      <Spinner size={14} />
      儲存中
    </button>
  ),
};
