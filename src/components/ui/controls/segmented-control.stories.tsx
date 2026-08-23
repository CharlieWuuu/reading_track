import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LayoutGrid, Rows3 } from "lucide-react";
import { ActionButton } from "./action-button";
import { SegmentedControl } from "./segmented-control";

const meta = {
  component: SegmentedControl,
  args: { items: [], value: "books", onChange: () => {} },
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 換一批資料：項目是文字 */
export const Tabs: Story = {
  render: function Render() {
    const [tab, setTab] = useState("books");
    return (
      <SegmentedControl
        items={[
          { key: "books", label: "書籍" },
          { key: "articles", label: "文章" },
          { key: "writing", label: "書寫" },
        ]}
        value={tab}
        onChange={setTab}
      />
    );
  },
};

/** 換一種畫法：給了 Icon 就畫圖示，label 退成 aria-label 與 tooltip */
export const Views: Story = {
  render: function Render() {
    const [view, setView] = useState("table");
    return (
      <SegmentedControl
        items={[
          { key: "table", label: "表格", Icon: () => <Rows3 size={16} strokeWidth={1.5} /> },
          { key: "card", label: "書封", Icon: () => <LayoutGrid size={16} strokeWidth={1.5} /> },
        ]}
        value={view}
        onChange={setView}
      />
    );
  },
};

/** sm：圖表面板裡的期間切換 */
export const Small: Story = {
  render: function Render() {
    const [range, setRange] = useState("all");
    return (
      <SegmentedControl
        size="sm"
        items={[
          { key: "all", label: "全部" },
          { key: "2y", label: "兩年" },
          { key: "1y", label: "一年" },
          { key: "6m", label: "六個月" },
        ]}
        value={range}
        onChange={setRange}
      />
    );
  },
};

/** 窄容器：自己橫捲，不把旁邊的東西擠出畫面 */
export const InNarrowContainer: Story = {
  render: function Render() {
    const [tab, setTab] = useState("books");
    return (
      <div className="flex w-64 items-center gap-2">
        <SegmentedControl
          items={[
            { key: "books", label: "書籍" },
            { key: "articles", label: "文章" },
            { key: "quotes", label: "佳句" },
            { key: "vocabulary", label: "單字" },
            { key: "keywords", label: "關鍵字" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <ActionButton>新增</ActionButton>
      </div>
    );
  },
};
