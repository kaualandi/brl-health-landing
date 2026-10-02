CREATE TABLE "fit_session_sets" (
	"session_id" bigint NOT NULL,
	"exercise_id" text NOT NULL,
	"exercise_order" integer NOT NULL,
	"set_number" integer NOT NULL,
	"weight_kg" numeric(6, 2),
	"reps" integer NOT NULL,
	"done" boolean NOT NULL,
	CONSTRAINT "fit_session_sets_session_id_exercise_order_set_number_pk" PRIMARY KEY("session_id","exercise_order","set_number")
);
--> statement-breakpoint
CREATE TABLE "fit_sessions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"client_id" uuid NOT NULL,
	"date" date NOT NULL,
	"day_index" integer NOT NULL,
	"day_name" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"duration_seconds" integer,
	CONSTRAINT "fit_sessions_user_client_uq" UNIQUE("user_id","client_id")
);
--> statement-breakpoint
ALTER TABLE "fit_session_sets" ADD CONSTRAINT "fit_session_sets_session_id_fit_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."fit_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit_session_sets" ADD CONSTRAINT "fit_session_sets_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit_sessions" ADD CONSTRAINT "fit_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fit_sessions_user_date_idx" ON "fit_sessions" USING btree ("user_id","date");