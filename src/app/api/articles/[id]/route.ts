import { createItemRoute } from "@/app/api/_lib/item-route";
import { deleteArticleRow, updateArticleRow } from "@/lib/db/mutations/articles";

const route = createItemRoute({
  key: "article",
  update: updateArticleRow,
  remove: deleteArticleRow,
});

export const PATCH = route.PATCH;
export const DELETE = route.DELETE;

export const maxDuration = 30;
