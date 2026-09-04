"use client";

import { CategorySelect } from "@/components/ui/category-select";
import { Field } from "@/components/ui/field";
import { OptionSelect } from "@/components/ui/option-select";
import { PrivateToggle } from "@/components/ui/private-toggle";

/** 一頁裡的分組小標：一行小字加一條線，跟詳細頁的章節標題同一個長相 */
function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-rule-soft shrink-0 border-b pb-1.5 text-sm font-semibold text-gray-900">
      {children}
    </h3>
  );
}

/** 短欄位三個一行；手機三欄會擠成一團，兩欄剛好 */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-0 shrink-0 grid-cols-2 content-start gap-3 sm:grid-cols-3">
      {children}
    </div>
  );
}

/** 書籍那一頁的欄位。狀態留在表單那邊，這裡只負責排版與把值交出去 */
export function BookFieldsPanel({
  form,
  set,
  keywordSuggestions,
  onEditKeyword,
}: {
  form: Record<string, string>;
  set: (key: string, value: string) => void;
  keywordSuggestions: string[];
  onEditKeyword: (name: string) => void;
}) {
  return (
    <>
      {/* 自己認得的那幾欄先來：書名獨佔一行，其餘兩兩成對 */}
      <div className="grid min-h-0 shrink-0 grid-cols-2 content-start gap-3">
        <div className="col-span-2">
          <Field label="書名" value={form.title} onChange={(v) => set("title", v)} />
        </div>

        {/* ISBN 跟著出版社走：它們講的是同一件事，這本書是哪一版。
              三個都是長字串，手機一行一個才讀得完 */}
        <div className="col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="作者" value={form.author} onChange={(v) => set("author", v)} />
          <Field label="出版社" value={form.publisher} onChange={(v) => set("publisher", v)} />
          <Field label="ISBN" value={form.isbn} onChange={(v) => set("isbn", v)} />
        </div>

        {/* 這三個都很短，擠成一行剛好，不用各佔半排；手機收成兩欄 */}
        <div className="col-span-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="頁數" value={form.pageCount} onChange={(v) => set("pageCount", v)} />
          <Field label="字數" value={form.wordCount} onChange={(v) => set("wordCount", v)} />
          <CategorySelect
            label="語言"
            categoryKey="language"
            value={form.language}
            onChange={(v) => set("language", v)}
          />
        </div>

        {/* 兩個網址跟上面那些欄位一樣是抓回來的，不值得自己一個分組 */}
        <Field label="封面網址" value={form.coverUrl} onChange={(v) => set("coverUrl", v)} />
        <Field label="來源網址" value={form.sourceUrl} onChange={(v) => set("sourceUrl", v)} />
      </div>

      {/* 標記不值得自己一頁：它跟上面一樣是填表，只是填的是自己的看法。
            小標跟它管的欄位包在一起，DOM 上就看得出是同一組 */}
      <div className="flex min-h-0 shrink-0 flex-col gap-3">
        <GroupTitle>標記</GroupTitle>

        {/* 三個一行：兩排欄位，最後一排是私人與關鍵字 */}
        <Section>
          <Field
            label="開始日期"
            type="date"
            value={form.startDate}
            onChange={(v) => set("startDate", v)}
          />
          <Field
            label="完成日期"
            type="date"
            value={form.endDate}
            onChange={(v) => set("endDate", v)}
          />

          {/* 平台是「我在哪讀的」，跟書本身無關，所以跟其他自訂分類放一起 */}
          <CategorySelect
            label="平台"
            categoryKey="platform"
            value={form.platform}
            onChange={(v) => set("platform", v)}
          />

          {/* 領域改成單選：它問的是「為什麼讀這本書」，一本書只會有一個答案 */}
          <CategorySelect
            label="領域"
            categoryKey="domain"
            value={form.domain}
            onChange={(v) => set("domain", v)}
          />
          <CategorySelect
            label="次領域"
            categoryKey="subDomain"
            value={form.subDomain}
            onChange={(v) => set("subDomain", v)}
            parentValue={form.domain}
          />
          <CategorySelect
            label="屬性"
            categoryKey="type"
            value={form.type}
            onChange={(v) => set("type", v)}
            multiple
          />

          {/* 私人跟關鍵字都是自己貼上去的標記，只是一個是開關、一個是標籤；
                關鍵字會塞很多個，佔兩欄 */}
          <PrivateToggle value={form.private} onChange={(v) => set("private", v)} />

          <div className="col-span-2 min-w-0">
            <OptionSelect
              label="關鍵字"
              options={keywordSuggestions}
              value={form.keywords}
              onChange={(v) => set("keywords", v)}
              onEditOption={onEditKeyword}
              placeholder="一個一組：地名、人名、事件、專有名詞"
              separator={"\n"}
              multiple
            />
          </div>
        </Section>
      </div>
    </>
  );
}
