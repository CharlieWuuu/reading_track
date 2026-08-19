import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TAG_TONES, type TagTone } from "@/lib/tagColors";
import { TagList } from "./tag-list";

const meta = {
  component: TagList,
  args: { values: ["哲學", "歷史", "經濟"] },
} satisfies Meta<typeof TagList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 沒給 tone：逐個標籤自己配色（文章的自由標籤） */
export const AutoColor: Story = {};

/** 給了 tone：整組同色，代表「這一格是哪一個欄位」 */
export const ByTone: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {(Object.keys(TAG_TONES) as TagTone[]).map((tone) => (
        <div key={tone} className="flex items-center gap-2">
          <span className="w-16 text-[10px] text-gray-500">{tone}</span>
          <TagList values={["哲學", "歷史"]} tone={tone} />
        </div>
      ))}
    </div>
  ),
};

export const Small: Story = {
  args: { size: "sm" },
};

/** wrap=false：擠在單行裡，放不下的交給外層裁掉 */
export const NoWrap: Story = {
  args: { values: ["哲學", "歷史", "經濟", "小說", "科普"], wrap: false },
  render: (args) => (
    <div className="w-48 overflow-hidden">
      <TagList {...args} />
    </div>
  ),
};

/** 一格塞多個值（頓號串起來的舊資料）會被拆開 */
export const Split: Story = {
  args: { values: ["哲學、歷史", undefined, "經濟"] },
};

/** 全空就整個不畫，不留空盒 */
export const Empty: Story = {
  args: { values: [undefined, ""] },
};
