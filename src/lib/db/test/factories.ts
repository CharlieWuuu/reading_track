import { KIND_TEMPLATES, STARTER_KEYS } from "@/config/kind-templates";
import { NEW_KIND_STATUSES } from "@/config/record-kinds";
import type { db as Db } from "@/lib/db/client";
import { kindFields, kinds, kindStatuses } from "@/lib/db/schema/kinds";
import { users } from "@/lib/db/schema/users";
import type { Book } from "@/types/book";

/** 測試用的一本書。全部欄位都是空字串，要測什麼就蓋什麼 */
export function makeBook(patch: Partial<Book> = {}): Book {
  return {
    id: crypto.randomUUID(),
    createdAt: "2026-01-01T00:00:00.000Z",
    title: "資本論",
    author: "馬克思",
    publisher: "",
    language: "中文",
    domain: "人文社科",
    subDomain: "歷史",
    type: "散文",
    platform: "",
    isbn: "",
    sourceUrl: "",
    coverUrl: "",
    pageCount: "",
    wordCount: "",
    status: "想讀",
    startDate: "",
    endDate: "",
    keywords: "",
    private: "",
    originId: "",
    note: "",
    quotes: "",
    vocabulary: "",
    relatedArticles: "",
    ...patch,
  };
}

/**
 * 每個測試檔先建一個人，多租戶之後所有讀寫都要掛在誰身上。
 *
 * 類型一起灌：寫入那一層要把「書籍」「已讀完」換成編號，沒有類型就寫不進去。
 * 這跟正式環境開帳號時做的是同一件事。
 */
export async function seedUser(db: typeof Db, email = "test@example.com"): Promise<string> {
  const [row] = await db.insert(users).values({ email }).returning({ id: users.id });
  await seedKindsInto(db, row.id);
  return row.id;
}

/** seedKinds 綁在正式的 db 上，測試用的是另一個實例，所以這裡重寫一份 */
async function seedKindsInto(db: typeof Db, userId: string): Promise<void> {
  const starters = KIND_TEMPLATES.filter((template) => STARTER_KEYS.has(template.key));
  const orders = new Map<string, number>();

  for (const template of starters) {
    const sortOrder = orders.get(template.group) ?? 0;
    orders.set(template.group, sortOrder + 1);

    const [kind] = await db
      .insert(kinds)
      .values({
        userId,
        groupKey: template.group,
        name: template.name,
        amountUnit: template.amountUnit,
        sortOrder,
      })
      .returning({ id: kinds.id });

    await db.insert(kindFields).values(
      template.modules.map((key, index) => ({
        userId,
        kindId: kind.id,
        fieldKey: key,
        label: template.labels?.[key] ?? "",
        sortOrder: index,
      })),
    );

    if (template.group === "records" && template.modules.includes("progress")) {
      await db.insert(kindStatuses).values(
        (template.statuses ?? NEW_KIND_STATUSES).map((status, index) => ({
          userId,
          kindId: kind.id,
          key: status.key,
          label: status.label,
          sortOrder: index,
        })),
      );
    }
  }
}
