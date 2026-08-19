import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Dialog } from "@/components/ui/Dialog";

const meta = {
  title: "ui/Dialog",
  component: Dialog,
  args: { title: "資本論", onClose: () => {}, children: null },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: <p className="text-sm">馬克思，1867 年。</p> },
};

/** 內容第一行就說明是什麼的時候，標題只是重複 */
export const WithoutTitle: Story = {
  args: { showTitle: false, children: <p className="text-sm font-semibold">剩餘價值</p> },
};

/** 內容超過高度時只有 body 捲，標題列不動 */
export const LongContent: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-2 text-sm">
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i}>第 {i + 1} 段內容。</p>
        ))}
      </div>
    ),
  },
};

/** 點背景或按 Esc 關閉——關掉之後長什麼樣只有這個 story 看得到 */
export const Toggleable: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    return (
      <div className="p-6">
        <button type="button" onClick={() => setOpen(true)} className="rounded border px-3 py-1.5">
          開啟
        </button>
        {open && (
          <Dialog {...args} onClose={() => setOpen(false)}>
            <p className="text-sm">點背景、按 Esc，或右上角的叉都會關掉。</p>
          </Dialog>
        )}
      </div>
    );
  },
};
