import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatusBadge, TagList } from "@/components/ui/TagBadge";
import { TAG_TONES, type TagTone } from "@/lib/tagColors";
import type { ReadingStatus } from "@/types/book";

const STATUSES: ReadingStatus[] = ["想讀", "閱讀中", "已讀完"];

const meta = {
  title: "ui/TagBadge",
  component: StatusBadge,
  args: { status: "閱讀中" },
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Status: Story = {};

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

/** 沒給 tone：逐個標籤自己配色（文章的自由標籤） */
export const TagsAutoColor: Story = {
  render: () => <TagList values={["哲學", "歷史", "經濟"]} />,
};

/** 給了 tone：整組同色，代表「這一格是哪一個欄位」 */
export const TagsByTone: Story = {
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

export const TagsSmall: Story = {
  render: () => <TagList values={["哲學", "歷史", "經濟"]} size="sm" />,
};

/** wrap=false：擠在單行裡，放不下的交給外層裁掉 */
export const TagsNoWrap: Story = {
  render: () => (
    <div className="w-48 overflow-hidden">
      <TagList values={["哲學", "歷史", "經濟", "小說", "科普"]} wrap={false} />
    </div>
  ),
};

/** 一格塞多個值（頓號串起來的舊資料）會被拆開 */
export const TagsSplit: Story = {
  render: () => <TagList values={["哲學、歷史", undefined, "經濟"]} />,
};

/** 全空就整個不畫，不留空盒 */
export const TagsEmpty: Story = {
  render: () => <TagList values={[undefined, ""]} />,
};
