import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CoverBand } from "./cover-band";

const meta = {
  component: CoverBand,
  args: { seed: "demo" },
} satisfies Meta<typeof CoverBand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RealCover: Story = {
  args: {
    coverUrl: "https://covers.openlibrary.org/b/id/8231856-L.jpg",
  },
};

export const GeneratedBlank: Story = {
  args: {},
};

/** 兩種畫法並排：真封面、空底色 */
export const AllKinds: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="w-28">
        <CoverBand coverUrl="https://covers.openlibrary.org/b/id/8231856-L.jpg" seed="a" />
      </div>
      <div className="w-28">
        <CoverBand seed="c" />
      </div>
    </div>
  ),
};
