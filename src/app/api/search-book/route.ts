import { NextRequest, NextResponse } from "next/server";

interface GoogleBookItem {
  volumeInfo: {
    title: string;
    authors?: string[];
    publisher?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string };
  };
}

export interface BookSearchResult {
  title: string;
  author: string;
  isbn: string;
  coverUrl: string;
  publisher: string;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");
  if (!query || !query.trim()) {
    return NextResponse.json({ error: "缺少搜尋關鍵字" }, { status: 400 });
  }

  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`
  );

  if (!res.ok) {
    const message = res.status === 429 ? "查詢次數已達上限，請稍後再試" : "搜尋失敗";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const data = await res.json();
  const items: GoogleBookItem[] = data.items ?? [];

  const results: BookSearchResult[] = items.map((item) => {
    const isbn13 = item.volumeInfo.industryIdentifiers?.find(
      (id) => id.type === "ISBN_13"
    );
    const isbn10 = item.volumeInfo.industryIdentifiers?.find(
      (id) => id.type === "ISBN_10"
    );

    return {
      title: item.volumeInfo.title ?? "",
      author: item.volumeInfo.authors?.join(", ") ?? "",
      isbn: isbn13?.identifier ?? isbn10?.identifier ?? "",
      coverUrl: item.volumeInfo.imageLinks?.thumbnail?.replace("http:", "https:") ?? "",
      publisher: item.volumeInfo.publisher ?? "",
    };
  });

  return NextResponse.json({ results });
}
