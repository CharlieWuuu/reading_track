import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LayoutGrid, Rows3 } from "lucide-react";
import { ActionButton } from "./action-button";
import { SelectMenu } from "./select-menu";

const meta = {
  component: SelectMenu,
  args: { items: [], value: "books", onChange: () => {}, label: "類型" },
} satisfies Meta<typeof SelectMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Render() {
    const [type, setType] = useState("books");
    return (
      <SelectMenu
        label="類型"
        items={[
          { key: "books", label: "書籍" },
          { key: "articles", label: "文章" },
          { key: "quotes", label: "佳句" },
          { key: "vocabulary", label: "單字" },
          { key: "keywords", label: "關鍵字" },
        ]}
        value={type}
        onChange={setType}
      />
    );
  },
};

/** 選項有圖示時，按鈕上也帶著——「顯示方式」那顆就是這樣 */
export const WithIcons: Story = {
  render: function Render() {
    const [view, setView] = useState("table");
    return (
      <SelectMenu
        label="顯示方式"
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

/** iconOnly：按鈕只留圖示，選單裡的中文照舊。閱讀的「顯示方式」用這一版 */
export const IconOnly: Story = {
  render: function Render() {
    const [view, setView] = useState("table");
    return (
      <SelectMenu
        iconOnly
        label="顯示方式"
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

/** 沒有圖示卻給了 iconOnly：退回顯示文字，不畫一顆只有箭頭的按鈕 */
export const IconOnlyWithoutIcons: Story = {
  render: function Render() {
    const [type, setType] = useState("books");
    return (
      <SelectMenu
        iconOnly
        label="類型"
        items={[
          { key: "books", label: "書籍" },
          { key: "articles", label: "文章" },
        ]}
        value={type}
        onChange={setType}
      />
    );
  },
};

/** 頁首那一列的實際編排：搜尋吃掉中間，兩顆選單與新增靠右 */
export const InPageHeader: Story = {
  render: function Render() {
    const [type, setType] = useState("books");
    const [view, setView] = useState("table");
    return (
      <div className="flex w-80 items-center gap-2">
        <h2 className="shrink-0 text-base font-semibold">閱讀</h2>
        <div className="rounded-control h-8 flex-1 border border-gray-300 md:h-9" />
        <SelectMenu
          label="類型"
          items={[
            { key: "books", label: "書籍" },
            { key: "keywords", label: "關鍵字" },
          ]}
          value={type}
          onChange={setType}
        />
        <SelectMenu
          label="顯示方式"
          items={[
            { key: "table", label: "表格", Icon: () => <Rows3 size={16} strokeWidth={1.5} /> },
            { key: "card", label: "書封", Icon: () => <LayoutGrid size={16} strokeWidth={1.5} /> },
          ]}
          value={view}
          onChange={setView}
        />
        <ActionButton>＋</ActionButton>
      </div>
    );
  },
};
