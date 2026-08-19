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
          { key: "entries", label: "片段" },
        ]}
        value={tab}
        onChange={setTab}
      />
    );
  },
};

/** 某個分頁底下還有多種看法時，點它是放下選單而不是換頁 */
export const WithMenu: Story = {
  render: function Render() {
    const [tab, setTab] = useState("books");
    const [view, setView] = useState("table");
    return (
      <TabBar
        items={[
          { key: "books", label: "書籍" },
          { key: "stats", label: "統計" },
        ]}
        value={tab}
        onChange={setTab}
        menu={{
          for: "stats",
          items: [
            { key: "table", label: "表格" },
            { key: "map", label: "地圖" },
          ],
          value: view,
          onChange: setView,
        }}
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
