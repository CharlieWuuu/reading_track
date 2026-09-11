import Link from "next/link";
import { LANDING_HERO, LANDING_SECTIONS, LandingSection } from "../landing-content";

/**
 * 未登入的首頁。報頭底下是頭條，再來三堆並排——
 * 一堆一欄，欄與欄之間一條細線，不畫卡片框。
 */

const styles = {
  hero: "border-rule-strong border-b-2 pt-8 pb-6",
  headline: "font-serif text-lede tracking-tight leading-tight font-semibold",
  lede: "font-serif text-note text-ink mt-3.5 max-w-[40em] leading-loose",
  columns: "grid gap-6 pt-6 md:grid-cols-3 md:gap-0",
  column: "border-rule md:border-r md:pr-6 md:last:border-r-0 md:not-first:pl-6",
  columnHead: "border-rule-strong flex items-baseline gap-2.5 border-b pb-2",
  columnTitle: "font-serif text-item font-semibold",
  tag: "text-label text-ink-faint tracking-label font-medium",
  body: "font-serif text-ink pt-3 text-[14.5px] leading-loose",
  sample: "border-rule-soft mt-4 border-t pt-4",
  sampleTitle: "font-serif text-item-sm mt-1.5 leading-snug font-semibold",
  meta: "text-meta text-ink-faint mt-1 tabular-nums",
  footer: "border-rule-strong mt-8 flex justify-end border-t py-6",
};

function Column({ section }: { section: LandingSection }) {
  return (
    <section className={styles.column}>
      <div className={styles.columnHead}>
        <h2 className={styles.columnTitle}>{section.title}</h2>
        <span className={styles.tag}>{section.tag}</span>
      </div>
      <p className={styles.body}>{section.body}</p>
      <div className={styles.sample}>
        <span className={`${styles.tag} text-accent`}>{section.sample.kind}</span>
        <p className={styles.sampleTitle}>{section.sample.title}</p>
        <p className={styles.meta}>{section.sample.meta}</p>
      </div>
    </section>
  );
}

export function Landing() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className={styles.hero}>
        <h1 className={styles.headline}>{LANDING_HERO.title}</h1>
        <p className={styles.lede}>{LANDING_HERO.lede}</p>
        <Link
          href="/login"
          className="bg-control-bg text-control-ink hover:bg-control-bg-hover text-ui mt-4 inline-block px-3 py-1.5 font-medium"
        >
          開始使用
        </Link>
      </div>

      <div className={styles.columns}>
        {LANDING_SECTIONS.map((section) => (
          <Column key={section.title} section={section} />
        ))}
      </div>

      <div className="flex-1" />
      <footer className={styles.footer}>
        <Link href="/privacy" className={`${styles.meta} hover:text-ink`}>
          隱私權政策
        </Link>
      </footer>
    </div>
  );
}
