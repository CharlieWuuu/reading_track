import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ActionButton } from "./action-button";

const meta = {
  component: ActionButton,
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { children: "新增書籍" },
};

export const Secondary: Story = {
  args: { children: "編輯", tone: "secondary" },
};

/** 給了 href 就變成連結，外觀完全一樣 */
export const AsLink: Story = {
  args: { children: "新增書籍", href: "/books/new" },
};
