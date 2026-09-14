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
import { deleteKeyword, renameKeyword, replaceKeywordInfo } from "@/lib/db/mutations/fragments";
import { listKeywords } from "@/lib/db/queries/fragments";
import { KeywordInfo } from "@/types/keyword";

async function GETHandler() {
  const session = await requireSession();
  if (!session) return unauthorized();

  try {
    const keywords = await listKeywords(session.user.id);
    return NextResponse.json({ keywords });
  } catch (err) {
    return dataFailure("讀取", "listKeywords", err);
  }
}

export const GET = guarded("keywords GET", GETHandler);
