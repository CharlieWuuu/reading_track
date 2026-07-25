import { Book } from "@/types/book";

interface GoogleBookItem {
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string };
  };
}

export const ENRICHABLE_FIELDS = ["author", "isbn", "coverUrl", "publisher"] as const;
export type EnrichableField = (typeof ENRICHABLE_FIELDS)[number];

export function needsEnrichment(book: Book): boolean {
  return ENRICHABLE_FIELDS.some((field) => !book[field]?.trim());
}

export async function fetchBookMetadata(title: string): Promise<Partial<Book> | null> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
      `intitle:${title}`
    )}&maxResults=1`
  );
  if (!res.ok) return null;

  const data = await res.json();
  const item: GoogleBookItem | undefined = data.items?.[0];
  if (!item) return null;

  const isbn13 = item.volumeInfo.industryIdentifiers?.find((id) => id.type === "ISBN_13");
  const isbn10 = item.volumeInfo.industryIdentifiers?.find((id) => id.type === "ISBN_10");

  return {
    author: item.volumeInfo.authors?.join(", ") ?? "",
    isbn: isbn13?.identifier ?? isbn10?.identifier ?? "",
    coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:") ?? "",
    publisher: item.volumeInfo.publisher ?? "",
  };
}

export function mergeEnrichment(book: Book, metadata: Partial<Book>): Partial<Book> {
  const patch: Partial<Book> = {};
  for (const field of ENRICHABLE_FIELDS) {
    if (!book[field]?.trim() && metadata[field]) {
      patch[field] = metadata[field];
    }
  }
  return patch;
}
