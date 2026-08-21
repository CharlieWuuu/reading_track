import { createCollectionRoute } from "@/app/api/_lib/collection-route";
import { addJournalRow, listJournal } from "@/lib/sheets";

const route = createCollectionRoute({
  key: "journal",
  itemKey: "journal",
  list: listJournal,
  add: addJournalRow,
});

export const GET = route.GET;
export const POST = route.POST;
