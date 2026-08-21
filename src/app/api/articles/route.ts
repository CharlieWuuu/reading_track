import { createCollectionRoute } from "@/app/api/_lib/collection-route";
import { addArticleRow, listArticles } from "@/lib/sheets";

const route = createCollectionRoute({
  key: "articles",
  itemKey: "article",
  list: listArticles,
  add: addArticleRow,
});

export const GET = route.GET;
export const POST = route.POST;

export const maxDuration = 30;
