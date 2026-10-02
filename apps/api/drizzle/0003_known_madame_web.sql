CREATE TABLE "fit_profiles" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"goal" text NOT NULL,
	"level" text NOT NULL,
	"days_per_week" integer NOT NULL,
	"location" text NOT NULL,
	"equipment" text[] DEFAULT '{}' NOT NULL,
	"session_minutes" integer NOT NULL,
	"limitations" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fit_profiles" ADD CONSTRAINT "fit_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;