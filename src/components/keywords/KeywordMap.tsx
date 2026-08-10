"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { KeywordEditDialog } from "@/components/keywords/KeywordEditDialog";
import { CATEGORICAL } from "@/lib/chartPalette";
import { useKeywordInfos } from "@/lib/useKeywordInfos";
import { Book, splitLines } from "@/types/book";
import { EMPTY_KEYWORD_INFO, KeywordInfo, parseCoordinates } from "@/types/keyword";

const styles = {
  wrap: "flex h-full min-h-0 flex-col gap-2",
  // isolate 把 leaflet 內部的高 z-index 關在自己的堆疊環境裡，才不會蓋掉外面的選單
  map: "min-h-0 flex-1 isolate rounded",
  legend: "flex shrink-0 flex-wrap items-center gap-1.5",
  legendItem: "overflow-hidden rounded-[2px]",
  // 書用封面認，線的顏色畫成封面的外框，兩件事合成一個圖例
  legendCover: "aspect-2/3 w-5 object-cover",
  legendBlank:
    "flex aspect-2/3 w-5 items-center justify-center bg-gray-100 text-[8px] leading-none text-gray-400",
  empty: "flex h-full items-center justify-center text-xs text-gray-400",
};

// Carto 的底圖：灰階、標註少，關鍵字的點才是主角
const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

const FALLBACK_CENTER: [number, number] = [23.6978, 120.9605];
const FALLBACK_ZOOM = 6;
const MAX_ZOOM = 18;
const FIT_PADDING = 40;

/** 色票只有八階，第九本之後一律用灰色，不自己生新顏色 */
const OVERFLOW_COLOR = "#9CA3AF";
const OVERFLOW_LABEL = "其他";

type MapPoint = { name: string; lat: number; lon: number };

type Route = { title: string; cover: string; color: string; points: MapPoint[] };

type KeywordMapProps = {
  books: Book[];
  infos: Map<string, KeywordInfo>;
};

/** 有座標的關鍵字畫成地圖：一本書一個顏色，同一本書的地點依記錄順序連成線 */
export function KeywordMap({ books, infos }: KeywordMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { save, remove } = useKeywordInfos();
  const [editing, setEditing] = useState<string | null>(null);

  // 父層每次 render 都給新的陣列，直接放進相依會讓地圖無限重建；改用內容當鍵，
  // 效果裡再從鍵還原回路線，重建只發生在資料真的變了的時候
  const routesKey = toRoutesKey(books, infos);
  const routes = fromRoutesKey(routesKey);

  useEffect(() => {
    const container = containerRef.current;
    const routes = fromRoutesKey(routesKey);
    const all = routes.flatMap((r) => r.points);
    if (!container || all.length === 0) return;

    const map = L.map(container, { scrollWheelZoom: false }).setView(
      FALLBACK_CENTER,
      FALLBACK_ZOOM,
    );
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: MAX_ZOOM }).addTo(map);

    for (const route of routes) {
      const latlngs = route.points.map((p) => [p.lat, p.lon] as [number, number]);
      // 兩個點以上才連得成線；順序就是關鍵字欄裡記下來的順序
      if (latlngs.length > 1) {
        L.polyline(latlngs, { color: route.color, weight: 2, opacity: 0.6 }).addTo(map);
      }

      for (const point of route.points) {
        L.circleMarker([point.lat, point.lon], {
          radius: 6,
          color: "#fff",
          weight: 2,
          fillColor: route.color,
          fillOpacity: 0.9,
        })
          .addTo(map)
          .bindTooltip(`${point.name}｜${route.title}`)
          .on("click", () => setEditing(point.name));
      }
    }

    map.fitBounds(L.latLngBounds(all.map((p) => [p.lat, p.lon] as [number, number])), {
      padding: [FIT_PADDING, FIT_PADDING],
      maxZoom: 10,
    });

    // 容器是 flex 撐出來的，建立當下量到的尺寸可能還不對，掛好再量一次
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.remove();
    };
  }, [routesKey]);

  if (routes.length === 0) {
    return <div className={styles.empty}>還沒有帶座標的關鍵字，先按「補齊資料」查維基</div>;
  }

  return (
    <div className={styles.wrap}>
      <div ref={containerRef} className={styles.map} />
      {/* 一本書一個顏色，沒有圖例就看不出線是誰的 */}
      <ul className={styles.legend}>
        {legendOf(routes).map((item) => (
          <li
            key={item.title}
            title={item.title}
            className={styles.legendItem}
            style={{ outline: `2px solid ${item.color}`, outlineOffset: "-2px" }}
          >
            {item.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.cover} alt="" loading="lazy" className={styles.legendCover} />
            ) : (
              <span className={styles.legendBlank}>{item.title.slice(0, 1)}</span>
            )}
          </li>
        ))}
      </ul>

      {editing && (
        <KeywordEditDialog
          info={infos.get(editing) ?? { name: editing, ...EMPTY_KEYWORD_INFO }}
          onSave={save}
          onDelete={remove}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/** 超出色票的書全共用灰色，圖例只出現一列「其他」 */
function legendOf(routes: Route[]): Array<{ title: string; cover: string; color: string }> {
  const seen = new Set<string>();
  return routes
    .map((r) => ({ title: r.title, cover: r.cover, color: r.color }))
    .filter((item) => !seen.has(item.title) && seen.add(item.title));
}

const FIELD = "";
const POINT = "";
const ROUTE = "\n";

/**
 * 路線從書出發而不是從關鍵字出發：順序要照關鍵字欄裡記的順序，
 * 而且同一個地點被兩本書提到時，兩條線都會經過它。
 */
function toRoutesKey(books: Book[], infos: Map<string, KeywordInfo>): string {
  const routes = books
    .map((book) => {
      const points = splitLines(book.keywords)
        .map((name) => ({ name, at: parseCoordinates(infos.get(name)?.coordinates ?? "") }))
        .filter((p) => p.at)
        .map((p) => [p.name, p.at!.lat, p.at!.lon].join(FIELD));
      return { title: book.title, cover: book.coverUrl, points };
    })
    .filter((route) => route.points.length > 0)
    .sort((a, b) => b.points.length - a.points.length);

  return routes
    .map((route, i) => [colorFor(i), route.title, route.cover, ...route.points].join(POINT))
    .join(ROUTE);
}

function colorFor(index: number): string {
  return index < CATEGORICAL.length ? CATEGORICAL[index] : OVERFLOW_COLOR;
}

function fromRoutesKey(key: string): Route[] {
  if (!key) return [];
  return key.split(ROUTE).map((row) => {
    const [color, title, cover, ...points] = row.split(POINT);
    return {
      color,
      // 超出色票的共用灰色，圖例就不該一本一列
      title: color === OVERFLOW_COLOR ? OVERFLOW_LABEL : title,
      cover: color === OVERFLOW_COLOR ? "" : cover,
      points: points.map((p) => {
        const [name, lat, lon] = p.split(FIELD);
        return { name, lat: Number(lat), lon: Number(lon) };
      }),
    };
  });
}
