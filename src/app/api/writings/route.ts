import { createCollectionRoute } from "@/app/api/_lib/collection-route";
import { addWritingRow, listWritings } from "@/lib/sheets";

const route = createCollectionRoute({
  key: "writings",
  itemKey: "writing",
  list: listWritings,
  add: addWritingRow,
});

export const GET = route.GET;
export const POST = route.POST;

export const maxDuration = 30;
