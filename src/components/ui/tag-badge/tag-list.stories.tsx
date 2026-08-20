import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TAG_TONES, type TagTone } from "@/utils/tag-colors";
import { TagList } from "./tag-list";

const meta = {
  component: TagList,
  args: { values: ["哲學", "歷史", "經濟"], tone: "domain" },
} satisfies Meta<typeof TagList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 每個欄位一個顏色：讀者先認出「這是哪一種分類」，才輪到「是哪一個值」 */
export const AllTones: Story = {
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
