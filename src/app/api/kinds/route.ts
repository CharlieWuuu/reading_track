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
import { KindGroup } from "@/config/record-kinds";
import { addKind } from "@/lib/db/mutations/kinds";
import { listKinds } from "@/lib/db/queries/kinds";

/** 三堆共用同一支：group 決定新增出來的類型屬於哪一堆 */
const GROUPS: KindGroup[] = ["records", "fragments", "writings"];

const isGroup = (value: unknown): value is KindGroup =>
  typeof value === "string" && GROUPS.includes(value as KindGroup);

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

  const body = await readJsonBody<{ group?: unknown; name?: unknown }>(req, "kinds POST");
  if (!body) return badRequest("看不懂的內容");
  if (!isGroup(body.group)) return badRequest("不知道要加在哪一堆");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return badRequest("類型要有名字");

  try {
    return NextResponse.json({ id: await addKind(session.user.id, body.group, name) });
  } catch (err) {
    return dataFailure("新增類型", "addKind", err);
  }
});
