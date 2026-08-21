import { createCollectionRoute } from "@/app/api/_lib/collection-route";
import { ITEM_KEYS } from "@/config/item-keys";
import { addArticleRow, listArticles } from "@/lib/sheets";

const route = createCollectionRoute({
  key: "articles",
  itemKey: ITEM_KEYS.articles,
  list: listArticles,
  add: addArticleRow,
});

export const GET = route.GET;
export const POST = route.POST;

export const maxDuration = 30;
