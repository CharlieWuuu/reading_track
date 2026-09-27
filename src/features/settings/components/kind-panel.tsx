"use client";

import { useCallback, useState } from "react";
import { PageAside, PageMain } from "@/components/layout/page-body";
import { CardStyle, defaultCardStyle } from "@/config/card-styles";
import { KindGroup } from "@/config/kind-groups";
import { DEFAULT_VIEWS } from "@/config/kind-views";
import { NAV_GROUPS } from "@/config/nav";
import { KindViewRail } from "@/features/settings/components/kind-view-rail";
import { TypeBuilder } from "@/features/settings/components/type-builder";
import { TypeDraft } from "@/features/settings/components/type-preview";
import { useKinds } from "@/hooks/use-kinds";
import { BookViewMode } from "@/stores/use-book-view-store";

/**
 * 類型的增減。原本掛在三個概覽頁的頁首上（/records/new-kind 那三條），
 * 但增減類型是設定，不是記一筆東西——放在頁首會跟「新增一筆紀錄」混淆。
 *
 * 三個分類全部攤開，類型縮排在各自底下，跟側欄同一種結構——那是使用者
 * 已經熟悉的形狀，也一眼看得出「哪一種東西歸在哪一堆」。分頁要點一下才
 * 換一組，反而看不到全貌。
 *
 * 移除只是關掉：預設與自訂一視同仁，資料與定義都不動，想再用就重新加回來。
 *
 * 兩個類型其實是同一種的時候，把名字改成一樣就好——欄位一致的話伺服器會併過去，
 * 不用另外一個「合併」動作。
 */

const styles = {
  list: "flex flex-col gap-6",
  group: "flex flex-col",
  groupHead: "border-rule-strong flex items-baseline justify-between border-b-2 pb-1.5",
  groupLabel: "font-serif text-ui font-semibold",
  addLink: "text-meta text-ink-faint hover:text-ink",
  row: "border-rule-soft flex items-baseline border-b py-[7px] pl-3",
  name: "text-ui text-ink-muted hover:text-ink flex-1 truncate text-left",
  count: "text-meta text-ink-faint ml-auto pl-2 tabular-nums",
  // 移除是破壞性的，用紅字；有資料不給按的時候褪掉，不要再喊得那麼大聲
  remove: "text-meta pl-3 text-red-700 hover:text-red-800 disabled:text-ink-faint/40",
  empty: "text-meta text-ink-faint py-[7px] pl-3",
  error: "text-meta text-red-700",
  builder: "pl-3",
};

export function KindPanel() {
  /** 展開中的新增表單屬於哪一個分類，null 就是沒展開 */
  const [adding, setAdding] = useState<KindGroup | null>(null);
  /** 正在改哪一個類型，null 就是沒在改 */
  const [editing, setEditing] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  /** 正在編輯的那一個類型的當下設定，右欄照它畫；沒在編輯就是 null */
  const [draft, setDraft] = useState<TypeDraft | null>(null);
  // 版面與卡片樣式。控制項畫在右欄，state 就放這裡——放在表單裡的話
  // 右欄要等它回報，每次回報都換一個新物件，點一下就被重建的畫面吃掉
  const [views, setViews] = useState<BookViewMode[]>(DEFAULT_VIEWS);
  const [cardStyle, setCardStyle] = useState<CardStyle>("fragment");
  /** 右欄點到哪一種檢視 */
  const [tab, setTab] = useState<BookViewMode>("overview");
  const { kinds, removeKind } = useKinds();

  // 身分固定所以不會每次 render 換一個，TypeBuilder 的 effect 才不會反覆觸發
  const onDraftChange = useCallback((next: TypeDraft) => setDraft(next), []);

  async function remove(kindId: string) {
    setRemoving(kindId);
    setError(undefined);
    try {
      await removeKind(kindId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "移除失敗");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <>
      <PageMain>
        <div className={styles.list}>
          {NAV_GROUPS.filter((nav) => nav.kindGroup).map((nav) => {
            const group = nav.kindGroup!;
            const rows = kinds.filter((kind) => kind.group === group);

            return (
              <div key={nav.key} className={styles.group}>
                <div className={styles.groupHead}>
                  <span className={styles.groupLabel}>{nav.label}</span>
                  {/* 新增的入口放在各分類自己的標題列上：按哪一顆就知道要加去哪裡 */}
                  <button
                    type="button"
                    onClick={() => {
                      setAdding(adding === group ? null : group);
                      setEditing(null);
                      // 新增是從預設開始
                      setViews(DEFAULT_VIEWS);
                      setCardStyle(defaultCardStyle(group));
                    }}
                    className={styles.addLink}
                  >
                    {adding === group ? "取消" : "新增"}
                  </button>
                </div>

                {rows.length === 0 && adding !== group && (
                  <span className={styles.empty}>還沒有任何類型</span>
                )}

                {rows.map((kind) => (
                  <div key={kind.id}>
                    <div className={styles.row}>
                      {/* 名字點下去就是改它：改名、改網址、改勾了哪些模組 */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(editing === kind.id ? null : kind.id);
                          setAdding(null);
                          // 帶入這個類型現在的設定
                          setViews(kind.views);
                          setCardStyle(kind.cardStyle);
                        }}
                        className={styles.name}
                      >
                        {kind.name}
                      </button>
                      <span className={styles.count}>
                        {kind.count.toLocaleString()} {nav.unit}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(kind.id)}
                        disabled={kind.count > 0 || removing === kind.id}
                        // 有資料就不給移除：手動記的東西沒有還原路徑，先清空那一步本身就是確認
                        title={kind.count > 0 ? "還有資料，要先清空才能移除" : undefined}
                        className={styles.remove}
                      >
                        移除
                      </button>
                    </div>
                    {editing === kind.id && (
                      <div className={styles.builder}>
                        <TypeBuilder
                          key={kind.id}
                          group={group}
                          editing={kind}
                          onDone={() => {
                            setEditing(null);
                            setDraft(null);
                          }}
                          onDraftChange={onDraftChange}
                          views={views}
                          onViewsChange={setViews}
                          cardStyle={cardStyle}
                          onCardStyleChange={setCardStyle}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {adding === group && (
                  <div className={styles.builder}>
                    <TypeBuilder
                      key={group}
                      group={group}
                      onDone={() => {
                        setAdding(null);
                        setDraft(null);
                      }}
                      onDraftChange={onDraftChange}
                      views={views}
                      onViewsChange={setViews}
                      cardStyle={cardStyle}
                      onCardStyleChange={setCardStyle}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {error && <span className={styles.error}>{error}</span>}
        </div>
      </PageMain>

      <PageAside>
        {draft && (
          <KindViewRail
            draft={draft}
            views={views}
            onViewsChange={setViews}
            cardStyle={cardStyle}
            onCardStyleChange={setCardStyle}
            tab={tab}
            onTabChange={setTab}
          />
        )}
      </PageAside>
    </>
  );
}
