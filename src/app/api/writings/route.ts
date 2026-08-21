import { createCollectionRoute } from "@/app/api/_lib/collection-route";
import { ITEM_KEYS } from "@/config/item-keys";
import { addWritingRow, listWritings } from "@/lib/sheets";

const route = createCollectionRoute({
  key: "writings",
  itemKey: ITEM_KEYS.writings,
  list: listWritings,
  add: addWritingRow,
});

export const GET = route.GET;
export const POST = route.POST;

export const maxDuration = 30;
