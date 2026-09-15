-- context 是「上下文、語境」，欄位裝的是例句（The absurd is born of this
-- confrontation. ／ 荒謬誕生於這樣的對峙）。畫面那層本來又自己叫 sentence，
-- 同一件事三個名字，一律收成 example。
ALTER TABLE "domain_fragments" RENAME COLUMN "context" TO "example";
--> statement-breakpoint
ALTER TABLE "domain_fragments" RENAME COLUMN "context_translation" TO "example_translation";
