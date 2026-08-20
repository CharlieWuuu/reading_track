import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TOKEN_MANIFEST, type TokenEntry, type TokenLayer } from "./generated/tokens.manifest";

/**
 * Design token 展示頁。內容全部從 style-dictionary 的 manifest 來，
 * 加了新 token 這裡自己會長出來，不用回來補。
 *
 * 色塊一律用 `var(--color-…)` 畫，不是用 manifest 裡的值：
 * 這樣看到的就是瀏覽器真的解出來的顏色，參照斷了會直接變透明，一眼看得出來。
 */
function Swatch({ token }: { token: TokenEntry }) {
  const name = token.name.replace(/^color-/, "");
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className="h-10 w-10 shrink-0 rounded border border-gray-200"
        style={{ background: `var(--${token.name})` }}
      />
      <div className="flex min-w-0 flex-col">
        <code className="truncate text-xs font-medium">{name}</code>
        {/* 參照的 token 顯示它指到哪，而不是攤平後的色碼——分層才看得出來 */}
        <code className="truncate text-[11px] text-gray-500">{token.alias ?? token.value}</code>
        {token.description && (
          <p className="mt-0.5 text-[11px] leading-snug text-gray-500">{token.description}</p>
        )}
      </div>
    </div>
  );
}

const LAYER_NOTES: Record<TokenLayer, string> = {
  primitive: "色票本身，沒有用途。元件不該直接挑這一層，除非它要的就是「第幾階」",
  semantic: "顏色的用途。改品牌色只要動 primitive，這一層跟著全站一起變",
  component: "只有單一元件在用的值。改這裡不會波及別人",
};

function Layer({ layer }: { layer: TokenLayer }) {
  const tokens = TOKEN_MANIFEST.filter((t) => t.layer === layer);
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">
          {layer} <span className="text-gray-400">（{tokens.length}）</span>
        </h2>
        <p className="text-xs text-gray-500">{LAYER_NOTES[layer]}</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
        {tokens.map((t) => (
          <Swatch key={t.name} token={t} />
        ))}
      </div>
    </section>
  );
}

const meta = {
  title: "Design tokens/色票",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** 三層一起看，才看得出「誰指到誰」 */
export const AllLayers: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-6">
      <Layer layer="primitive" />
      <Layer layer="semantic" />
      <Layer layer="component" />
    </div>
  ),
};

export const Primitive: Story = {
  render: () => (
    <div className="p-6">
      <Layer layer="primitive" />
    </div>
  ),
};

export const Semantic: Story = {
  render: () => (
    <div className="p-6">
      <Layer layer="semantic" />
    </div>
  ),
};

export const Component: Story = {
  render: () => (
    <div className="p-6">
      <Layer layer="component" />
    </div>
  ),
};
