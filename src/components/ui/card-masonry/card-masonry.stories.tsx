import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CardMasonry } from "./card-masonry";

const HEIGHTS = [80, 140, 60, 200, 110, 90, 160, 70, 130];

const meta = {
  component: CardMasonry,
  args: { children: null },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CardMasonry>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 卡片高度參差才看得出瀑布式在做什麼；拉寬視窗會從兩欄變三欄 */
export const Default: Story = {
  render: () => (
    <div className="p-4">
      <CardMasonry>
        {HEIGHTS.map((height, i) => (
          <div
            key={i}
            style={{ height }}
            className="flex items-center justify-center rounded border bg-gray-50 text-sm text-gray-500"
          >
            {i + 1}
          </div>
        ))}
      </CardMasonry>
    </div>
  ),
};

export const Single: Story = {
  render: () => (
    <div className="p-4">
      <CardMasonry>
        <div className="flex h-24 items-center justify-center rounded border bg-gray-50 text-sm text-gray-500">
          只有一張
        </div>
      </CardMasonry>
    </div>
  ),
};
