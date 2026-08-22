import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LayoutGrid, Table } from "lucide-react";
import { ActionButton } from "./action-button";
import { TabBar } from "./tab-bar";
import { ViewToggle } from "./view-toggle";

const meta = {
  component: TabBar,
  args: { items: [], value: "books", onChange: () => {} },
} satisfies Meta<typeof TabBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Render() {
    const [tab, setTab] = useState("books");
    return (
      <TabBar
        items={[
          { key: "books", label: "書籍" },
          { key: "articles", label: "文章" },
          { key: "writings", label: "片段" },
        ]}
        value={tab}
        onChange={setTab}
      />
    );
  },
};

/** 窄容器：分頁列自己橫捲，不會把旁邊的東西擠出畫面 */
export const InNarrowContainer: Story = {
  render: function Render() {
    const [tab, setTab] = useState("books");
    return (
      <div className="flex w-64 items-center gap-2">
        <TabBar
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

/** sm：圖表面板裡的期間切換用這一版，同一套長相但不搶圖的位置 */
export const Small: Story = {
  render: function Render() {
    const [range, setRange] = useState("all");
    return (
      <TabBar
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

/** 三種控制項排在同一列——高度對不對得起來只有這樣才看得出來 */
export const InOneRow: Story = {
  render: function Render() {
    const [tab, setTab] = useState("books");
    const [view, setView] = useState("table");
    return (
      <div className="flex flex-wrap items-center gap-2">
        <TabBar
          items={[
            { key: "books", label: "書籍" },
            { key: "articles", label: "文章" },
          ]}
          value={tab}
          onChange={setTab}
        />
        <ViewToggle
          items={[
            { key: "table", label: "表格", Icon: () => <Table size={16} /> },
            { key: "cards", label: "卡片", Icon: () => <LayoutGrid size={16} /> },
          ]}
          value={view}
          onChange={setView}
        />
        <ActionButton>新增</ActionButton>
        <ActionButton tone="secondary">篩選</ActionButton>
      </div>
    );
  },
};
