import { createItemRoute } from "@/app/api/_lib/item-route";
import { deleteEntryRow, updateEntryRow } from "@/lib/sheets";

const route = createItemRoute({
  key: "entry",
  update: updateEntryRow,
  remove: deleteEntryRow,
});

export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
