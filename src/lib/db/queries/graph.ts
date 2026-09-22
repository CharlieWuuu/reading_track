import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { internalLinks } from "@/lib/db/schema/internal-links";
import { kinds } from "@/lib/db/schema/kinds";
import { works } from "@/lib/db/schema/works";
import { writings } from "@/lib/db/schema/writings";
import type { GraphData } from "@/types/graph";

/**
 * 關係圖的資料：三張可連結的表全撈成節點，links_internal 是邊。
 *
 * 孤點照樣出現——沒連過的那些散在外圈，本來就是要看得到誰還沒接上。
 * records 不進圖：紀錄連的是作品，站內連結不指向它。
 */
export async function graphData(userId: string): Promise<GraphData> {
  const node = (table: typeof works | typeof fragments | typeof writings) =>
    db
      .select({
        id: table.id,
        label: table.title,
        kindName: kinds.name,
        groupKey: kinds.groupKey,
      })
      .from(table)
      .innerJoin(kinds, eq(kinds.id, table.kindId))
      .where(eq(table.userId, userId));

  const [workRows, fragmentRows, writingRows, linkRows] = await Promise.all([
    node(works),
    node(fragments),
    node(writings),
    db
      .select({ source: internalLinks.aId, target: internalLinks.bId })
      .from(internalLinks)
      .where(eq(internalLinks.userId, userId)),
  ]);

  const nodes = [...workRows, ...fragmentRows, ...writingRows];
  const known = new Set(nodes.map((n) => n.id));
  const links = linkRows.filter((l) => known.has(l.source) && known.has(l.target)); // 指向已刪資料的舊邊丟掉，force graph 會炸

  return { nodes, links };
}
