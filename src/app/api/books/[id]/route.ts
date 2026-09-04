import { createItemRoute } from "@/app/api/_lib/item-route";
import { deleteBookRow, updateBookRow } from "@/lib/db/mutations/books";

const route = createItemRoute({
  key: "book",
  update: updateBookRow,
  remove: deleteBookRow,
});

export const PATCH = route.PATCH;
export const DELETE = route.DELETE;

export const maxDuration = 30;
