-- Corrige valores jsonb gravados como string JSON (dupla serialização do driver bun-sql).
UPDATE "nutri_profiles" SET "meals" = ("meals" #>> '{}')::jsonb WHERE jsonb_typeof("meals") = 'string';--> statement-breakpoint
UPDATE "articles" SET "body" = ("body" #>> '{}')::jsonb WHERE jsonb_typeof("body") = 'string';--> statement-breakpoint
UPDATE "habit_logs" SET "done" = ("done" #>> '{}')::jsonb WHERE jsonb_typeof("done") = 'string';--> statement-breakpoint
UPDATE "meal_logs" SET "done" = ("done" #>> '{}')::jsonb WHERE jsonb_typeof("done") = 'string';--> statement-breakpoint
UPDATE "analytics_events" SET "props" = ("props" #>> '{}')::jsonb WHERE jsonb_typeof("props") = 'string';
