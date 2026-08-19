import { createItemRoute } from "@/app/api/_lib/itemRoute";
import { deleteBookRow, updateBookRow } from "@/lib/sheets";

const route = createItemRoute({
  key: "book",
  update: updateBookRow,
  remove: deleteBookRow,
});

export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
