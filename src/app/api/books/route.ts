import { createCollectionRoute } from "@/app/api/_lib/collection-route";
import { ITEM_KEYS } from "@/config/item-keys";
import { addBookRow } from "@/lib/db/mutations/books";
import { listBooks } from "@/lib/db/queries/books";

const route = createCollectionRoute({
  key: "books",
  itemKey: ITEM_KEYS.books,
  list: listBooks,
  add: addBookRow,
});

export const GET = route.GET;
export const POST = route.POST;

export const maxDuration = 30;
