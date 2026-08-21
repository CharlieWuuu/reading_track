import { createItemRoute } from "@/app/api/_lib/item-route";
import { deleteJournalRow, updateJournalRow } from "@/lib/sheets";

const route = createItemRoute({
  key: "journal",
  update: updateJournalRow,
  remove: deleteJournalRow,
});

export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
