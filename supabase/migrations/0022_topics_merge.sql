-- book_types 改名 topics，書寫的類型（writing_types）併進來當頂層節點。
ALTER TABLE "book_types" RENAME TO "topics";
--> statement-breakpoint

INSERT INTO "topics" ("id", "user_id", "parent_id", "name", "is_private")
SELECT "id", "user_id", NULL, "name", "is_private" FROM "writing_types";
--> statement-breakpoint

-- _writings_deprecated_20260908（早就沒在用的舊表）還掛著一條外鍵指過來，
-- CASCADE 只會連帶砍掉那條外鍵，不會動到那張表本身。
DROP TABLE "writing_types" CASCADE;
