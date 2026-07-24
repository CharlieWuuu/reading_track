import type { Page } from "playwright-core";
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
  scrape: (page: Page) => Promise<ScrapedBook>;
}
