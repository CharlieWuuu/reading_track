import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ReadingStatus } from "@/types/book";
import { StatusBadge } from "./status-badge";

const STATUSES: ReadingStatus[] = ["想讀", "閱讀中", "已讀完"];

const meta = {
  component: StatusBadge,
  args: { status: "閱讀中" },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 三個狀態是同色相的三階，代表進度而不是三種分類 */
export const AllStatuses: Story = {
  render: () => (
    <div className="flex gap-2">
      {STATUSES.map((status) => (
        <StatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};
