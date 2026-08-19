import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LayoutGrid, Map, Table } from "lucide-react";
import { ActionButton, TabBar, ViewToggle } from "@/components/ui/Controls";

const meta = {
  title: "ui/Controls",
  component: ActionButton,
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { children: "新增書籍" },
};

export const Secondary: Story = {
  args: { children: "編輯", tone: "secondary" },
};

/** 給了 href 就變成連結，外觀完全一樣 */
export const AsLink: Story = {
  args: { children: "新增書籍", href: "/books/new" },
};

export const Tabs: Story = {
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
export const TabsWithMenu: Story = {
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

export const Views: Story = {
  render: function Render() {
    const [view, setView] = useState("table");
    return (
      <ViewToggle
        items={[
          { key: "table", label: "表格", Icon: () => <Table size={16} /> },
          { key: "cards", label: "卡片", Icon: () => <LayoutGrid size={16} /> },
          { key: "map", label: "地圖", Icon: () => <Map size={16} /> },
        ]}
        value={view}
        onChange={setView}
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
