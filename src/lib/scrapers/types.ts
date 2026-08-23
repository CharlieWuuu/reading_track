import type { Page } from "playwright-core";
import { BookPlatform } from "@/types/book";

export interface ScrapedBook {
  title: string;
  author: string;
  coverUrl: string;
  publisher: string;
  platform: BookPlatform;
  language?: string;
  pageCount?: string;
  wordCount?: string;
  isbn?: string;
}

export interface Scraper {
  platform: BookPlatform;
  matches: (url: string) => boolean;
  scrape: (page: Page) => Promise<ScrapedBook>;
}
