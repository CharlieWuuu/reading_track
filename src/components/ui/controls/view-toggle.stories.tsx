import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LayoutGrid, Map, Table } from "lucide-react";
import { ViewToggle } from "./view-toggle";

const meta = {
  component: ViewToggle,
} satisfies Meta<typeof ViewToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { items: [], value: "table", onChange: () => {} },
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
