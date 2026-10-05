import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PagerButton } from "@/components/ui/pager-button";
import { Panel } from "./panel";

const meta = {
  component: Panel,
  args: { title: "月曆", children: <div className="h-40 bg-gray-50" /> },
  decorators: [(Story) => <div className="flex h-64 flex-col">{Story()}</div>],
} satisfies Meta<typeof Panel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 標題右側放切換鈕：月曆的換月 */
export const WithTitleAction: Story = {
  args: {
    titleAction: (
      <div className="flex items-center gap-2">
        <PagerButton direction="prev" label="上個月" onClick={() => {}} />
        <span className="text-sm">2026 年 10 月</span>
        <PagerButton direction="next" label="下個月" onClick={() => {}} disabled />
      </div>
    ),
  },
};
