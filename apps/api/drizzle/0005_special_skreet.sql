CREATE TABLE "fit_plan_days" (
	"user_id" bigint NOT NULL,
	"day_index" integer NOT NULL,
	"name" text NOT NULL,
	"focus" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "fit_plan_days_user_id_day_index_pk" PRIMARY KEY("user_id","day_index")
);
--> statement-breakpoint
CREATE TABLE "fit_plan_exercises" (
	"user_id" bigint NOT NULL,
	"day_index" integer NOT NULL,
	"position" integer NOT NULL,
	"exercise_id" text NOT NULL,
	"sets" integer NOT NULL,
	"reps_min" integer NOT NULL,
	"reps_max" integer NOT NULL,
	"rest_seconds" integer NOT NULL,
	CONSTRAINT "fit_plan_exercises_user_id_day_index_position_pk" PRIMARY KEY("user_id","day_index","position")
);
--> statement-breakpoint
CREATE TABLE "fit_plans" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"seed" bigint NOT NULL,
	"split" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fit_plan_days" ADD CONSTRAINT "fit_plan_days_user_id_fit_plans_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."fit_plans"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit_plan_exercises" ADD CONSTRAINT "fit_plan_exercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit_plan_exercises" ADD CONSTRAINT "fit_plan_exercises_user_id_day_index_fit_plan_days_user_id_day_index_fk" FOREIGN KEY ("user_id","day_index") REFERENCES "public"."fit_plan_days"("user_id","day_index") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fit_plans" ADD CONSTRAINT "fit_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;