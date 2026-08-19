import { createItemRoute } from "@/app/api/_lib/itemRoute";
import { deleteArticleRow, updateArticleRow } from "@/lib/sheets";

const route = createItemRoute({
  key: "article",
  update: updateArticleRow,
  remove: deleteArticleRow,
});

export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
