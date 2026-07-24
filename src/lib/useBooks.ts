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

  const { data, error, isLoading, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
  });

  return {
    books: data?.books ?? [],
    isLoading,
    error: error instanceof Error ? error.message : undefined,
    mutate,
  };
}
