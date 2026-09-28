import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DomainFilter } from "./domain-filter";

const DOMAINS = ["人文社科", "程式", "語言學習"];

const meta = {
  component: DomainFilter,
  args: { domains: DOMAINS, value: null, onToggle: () => {} },
} satisfies Meta<typeof DomainFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 點一下選、再點一下取消 */
export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <div className="w-56">
        <DomainFilter
          domains={DOMAINS}
          value={value}
          onToggle={(domain) => setValue((current) => (current === domain ? null : domain))}
        />
      </div>
    );
  },
};

export const Selected: Story = { args: { value: "程式" } };
