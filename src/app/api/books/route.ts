import { createCollectionRoute } from "@/app/api/_lib/collection-route";
import { addBookRow, listBooks } from "@/lib/sheets";

const route = createCollectionRoute({
  key: "books",
  itemKey: "book",
  list: listBooks,
  add: addBookRow,
});

export const GET = route.GET;
export const POST = route.POST;
