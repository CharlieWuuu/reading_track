import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookCover, type BookCoverSize } from "./book-cover";

const SIZES: BookCoverSize[] = ["xs", "sm", "md", "lg", "xl", "search", "detail", "full"];

const meta = {
  component: BookCover,
  args: { url: "", title: "資本論" },
} satisfies Meta<typeof BookCover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fallback: Story = {};

export const WithCover: Story = {
  args: { url: "https://covers.openlibrary.org/b/id/8231856-L.jpg" },
};

/** 八個級距一次看完：這是判斷「有沒有級距其實重複」的地方 */
export const AllSizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-end gap-4">
      {SIZES.map((size) => (
        <div key={size} className="flex w-24 flex-col items-center gap-1">
          <BookCover {...args} size={size} />
          <span className="text-[10px] text-gray-500">{size}</span>
        </div>
      ))}
    </div>
  ),
};

/** flat 拿掉外框與陰影，給外面已經有一圈顏色的地方用 */
export const Flat: Story = {
  args: { url: "https://covers.openlibrary.org/b/id/8231856-L.jpg", size: "detail", flat: true },
};

/** 沒有書名時退回破折號 */
export const NoTitle: Story = {
  args: { title: "", size: "detail" },
};
