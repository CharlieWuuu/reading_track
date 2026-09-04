import { createItemRoute } from "@/app/api/_lib/item-route";
import { deleteWritingRow, updateWritingRow } from "@/lib/db/mutations/writings";

const route = createItemRoute({
  key: "writings",
  update: updateWritingRow,
  remove: deleteWritingRow,
});

export const PATCH = route.PATCH;
export const DELETE = route.DELETE;

export const maxDuration = 30;
