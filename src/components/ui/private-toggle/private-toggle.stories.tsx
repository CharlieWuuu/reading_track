import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PrivateToggle } from "./private-toggle";

const meta = {
  component: PrivateToggle,
  args: { value: "", onChange: () => {} },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <PrivateToggle {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof PrivateToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};

/** 勾起來的值就是 Sheet 上那一格「是」 */
export const On: Story = {
  args: { value: "是" },
};
