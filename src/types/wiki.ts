/** 維基與 Wikidata 回應裡跨檔用到的形狀；只在單一檔案用的留在該檔 */

export type WikiPage = {
  missing?: boolean;
  title: string;
  extract?: string;
  coordinates?: Array<{ lat: number; lon: number; primary?: boolean }>;
  pageprops?: { wikibase_item?: string; disambiguation?: string };
};

export type WikidataTime = { time?: string };

export type WikidataClaim = { mainsnak?: { datavalue?: { value?: WikidataTime } } };
