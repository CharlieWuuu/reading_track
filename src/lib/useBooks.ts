import useSWR from "swr";
import { useSheetStore } from "@/store/useSheetStore";
import { Book } from "@/types/book";

async function fetcher(url: string): Promise<{ books: Book[] }> {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "讀取失敗");
  return data;
}

export function useBooks() {
  const { sheetId } = useSheetStore();
  const key = sheetId ? `/api/books?sheetId=${encodeURIComponent(sheetId)}` : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(key, fetcher);

  return {
    books: data?.books ?? [],
    isLoading,
    isValidating,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
