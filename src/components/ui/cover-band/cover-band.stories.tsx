import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CoverBand } from "./cover-band";

const meta = {
  component: CoverBand,
  args: { seed: "demo" },
} satisfies Meta<typeof CoverBand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RealCoverLarge: Story = {
  args: {
    coverUrl: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
    size: "lg",
  },
};

export const RealCoverSmall: Story = {
  args: {
    coverUrl: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
    size: "sm",
  },
};

export const GeneratedWithLabel: Story = {
  args: { label: "allometric", size: "sm" },
};

export const GeneratedBlank: Story = {
  args: { size: "sm" },
};

/** 三種畫法並排：真封面、有字生成塊、空底色 */
export const AllKinds: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="w-28">
        <CoverBand coverUrl="https://covers.openlibrary.org/b/id/8231856-L.jpg" seed="a" />
      </div>
      <div className="w-28">
        <CoverBand seed="allometric" label="allometric" />
      </div>
      <div className="w-28">
        <CoverBand seed="c" />
      </div>
    </div>
  ),
};
