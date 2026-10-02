CREATE TABLE "exercises" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"gif_url" text NOT NULL,
	"media_path" text,
	"body_parts" text[] DEFAULT '{}' NOT NULL,
	"target_muscles" text[] DEFAULT '{}' NOT NULL,
	"secondary_muscles" text[] DEFAULT '{}' NOT NULL,
	"equipments" text[] DEFAULT '{}' NOT NULL,
	"instructions" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ix_exercises_name" ON "exercises" USING btree ("name");