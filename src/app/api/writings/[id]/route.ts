import { createItemRoute } from "@/app/api/_lib/item-route";
import { deleteWritingRow, updateWritingRow } from "@/lib/sheets";

const route = createItemRoute({
  key: "writings",
  update: updateWritingRow,
  remove: deleteWritingRow,
});

export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
