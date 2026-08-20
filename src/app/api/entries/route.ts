import { createCollectionRoute } from "@/app/api/_lib/collection-route";
import { addEntryRow, listEntries } from "@/lib/sheets";

const route = createCollectionRoute({
  key: "entries",
  itemKey: "entry",
  list: listEntries,
  add: addEntryRow,
});

export const GET = route.GET;
export const POST = route.POST;
