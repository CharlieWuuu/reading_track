import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  dataFailure,
  guarded,
  readJsonBody,
  readOnly,
  requireSession,
  requireWriter,
  unauthorized,
} from "@/app/api/_lib/respond";
import { moduleDef } from "@/config/modules";
import { KindGroup } from "@/config/record-kinds";
import { addKind } from "@/lib/db/mutations/kinds";
import { listKinds, slugTaken } from "@/lib/db/queries/kinds";

/** 三堆共用同一支：group 決定新增出來的類型屬於哪一堆 */
const GROUPS: KindGroup[] = ["records", "fragments", "writings"];

const isGroup = (value: unknown): value is KindGroup =>
  typeof value === "string" && GROUPS.includes(value as KindGroup);

/** 網址上的那一段：小寫英數與連字號，不能是空的或以連字號開頭結尾 */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const GET = guarded("kinds GET", async () => {
  const session = await requireSession();
  if (!session) return unauthorized();

  try {
    return NextResponse.json({ kinds: await listKinds(session.user.id) });
  } catch (err) {
    return dataFailure("讀取類型", "listKinds", err);
  }
});

export const POST = guarded("kinds POST", async (req: NextRequest) => {
  const session = await requireWriter();
  if (!session) return unauthorized();
  if ("demo" in session) return readOnly();

  const body = await readJsonBody<{
    group?: unknown;
    name?: unknown;
    slug?: unknown;
    modules?: unknown;
    amountUnit?: unknown;
    labels?: unknown;
  }>(req, "kinds POST");
  if (!body) return badRequest("看不懂的內容");
  if (!isGroup(body.group)) return badRequest("不知道要加在哪一堆");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return badRequest("類型要有名字");

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!SLUG_PATTERN.test(slug)) return badRequest("網址只能用小寫英文、數字、連字號");
  if (await slugTaken(session.user.id, body.group, slug)) return badRequest("這個網址已經有人用了");

  // 認不得的模組直接丟掉，不讓客戶端往資料庫塞任意字串
  const modules = Array.isArray(body.modules)
    ? body.modules.filter(
        (key): key is string => typeof key === "string" && Boolean(moduleDef(key)),
      )
    : [];
  const amountUnit = typeof body.amountUnit === "string" ? body.amountUnit.trim() : "";
  const labels =
    body.labels && typeof body.labels === "object"
      ? Object.fromEntries(
          Object.entries(body.labels as Record<string, unknown>).filter(
            ([, value]) => typeof value === "string",
          ) as [string, string][],
        )
      : {};

  try {
    const id = await addKind(session.user.id, body.group, {
      name,
      slug,
      modules,
      amountUnit,
      labels,
    });
    return NextResponse.json({ id });
  } catch (err) {
    return dataFailure("新增類型", "addKind", err);
  }
});
