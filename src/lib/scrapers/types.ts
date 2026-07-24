import { BookPlatform } from "@/types/book";

export interface ScrapedBook {
  title: string;
  author: string;
  isbn: string;
  coverUrl: string;
  publisher: string;
  platform: BookPlatform;
}

export interface Scraper {
  platform: BookPlatform;
  matches: (url: string) => boolean;
  scrape: (url: string, html: string) => ScrapedBook;
}
