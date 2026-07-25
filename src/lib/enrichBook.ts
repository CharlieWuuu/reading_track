import { Book } from "@/types/book";
import { searchReadmoo } from "./scrapers/readmooSearch";

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

async function fetchFromGoogleBooks(title: string): Promise<Partial<Book> | null> {
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

async function fetchFromReadmoo(title: string): Promise<Partial<Book> | null> {
  const result = await searchReadmoo(title).catch(() => null);
  if (!result) return null;
  return {
    author: result.author,
    isbn: result.isbn,
    coverUrl: result.coverUrl,
    publisher: result.publisher,
  };
}

const PROVIDERS = [fetchFromGoogleBooks, fetchFromReadmoo];

/** Tries each metadata source in order, returning the first non-empty match. */
export async function fetchBookMetadata(title: string): Promise<Partial<Book> | null> {
  for (const provider of PROVIDERS) {
    const result = await provider(title).catch(() => null);
    if (result) return result;
  }
  return null;
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
