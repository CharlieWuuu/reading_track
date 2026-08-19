import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Favicon } from "./favicon";

const meta = {
  component: Favicon,
  args: { url: "https://www.gutenberg.org/ebooks/46423", fallback: "Gutenberg" },
} satisfies Meta<typeof Favicon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 沒網址就退回站名第一個字 */
export const NoUrl: Story = {
  args: { url: "" },
};

/** 網址壞掉也走同一條退路 */
export const BrokenUrl: Story = {
  args: { url: "not a url" },
};

/** 連 fallback 都空的時候留一個破折號，不留空白 */
export const NoFallback: Story = {
  args: { url: "", fallback: "" },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-3">
      {["size-4", "size-6", "size-8"].map((size) => (
        <Favicon key={size} {...args} className={size} />
      ))}
    </div>
  ),
};
