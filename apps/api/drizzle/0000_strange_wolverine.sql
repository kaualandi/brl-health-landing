CREATE TABLE "analytics_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"props" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"emoji" text,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"read_time" text NOT NULL,
	"author" text NOT NULL,
	"goals" text[] DEFAULT '{}' NOT NULL,
	"body" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"nutritionist_id" text NOT NULL,
	"date" date NOT NULL,
	"time" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_tokens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"purpose" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"emoji" text,
	"role" text NOT NULL,
	"portion" text NOT NULL,
	"kcal" integer NOT NULL,
	"protein" integer NOT NULL,
	"carb" integer NOT NULL,
	"fat" integer NOT NULL,
	"diets" text[] DEFAULT '{}' NOT NULL,
	"excluded_by" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"date" date NOT NULL,
	"done" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "habit_logs_user_id_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "meal_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"date" date NOT NULL,
	"done" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "meal_logs_user_id_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "measurements" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"date" date NOT NULL,
	"waist" numeric(5, 1),
	"hip" numeric(5, 1),
	"chest" numeric(5, 1),
	"arm" numeric(5, 1),
	"thigh" numeric(5, 1),
	CONSTRAINT "measurements_user_id_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "nutri_profiles" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"sex" text NOT NULL,
	"age" integer NOT NULL,
	"height_cm" numeric(5, 1) NOT NULL,
	"weight_kg" numeric(5, 1) NOT NULL,
	"target_kg" numeric(5, 1),
	"goal" text NOT NULL,
	"activity" text NOT NULL,
	"diet" text NOT NULL,
	"restrictions" text[] DEFAULT '{}' NOT NULL,
	"meals_per_day" integer DEFAULT 3 NOT NULL,
	"water_glasses" integer DEFAULT 8 NOT NULL,
	"meals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"wake_time" text,
	"train_time" text,
	"sleep_time" text
);
--> statement-breakpoint
CREATE TABLE "nutritionists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"crn" text NOT NULL,
	"focus" text NOT NULL,
	"bio" text,
	"rating" numeric(2, 1),
	"reviews" integer,
	"years" integer,
	"avatar" text,
	"goals" text[] DEFAULT '{}' NOT NULL,
	"diets" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"monthly_price" numeric(8, 2) NOT NULL,
	"rank" integer NOT NULL,
	"credits" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"emoji" text,
	"category" text NOT NULL,
	"excerpt" text NOT NULL,
	"prep_time" text NOT NULL,
	"kcal" integer NOT NULL,
	"protein" integer NOT NULL,
	"carbs" integer NOT NULL,
	"fat" integer NOT NULL,
	"servings" integer DEFAULT 1 NOT NULL,
	"diet" text NOT NULL,
	"goals" text[] DEFAULT '{}' NOT NULL,
	"ingredients" text[] DEFAULT '{}' NOT NULL,
	"steps" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "sleep_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"date" date NOT NULL,
	"hours" numeric(4, 1) NOT NULL,
	CONSTRAINT "sleep_logs_user_id_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "step_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"date" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "step_logs_user_id_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"plan_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"has_pending_charge" boolean DEFAULT false NOT NULL,
	"current_period_end" date,
	"stripe_customer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"source" text DEFAULT 'fit' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "water_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"date" date NOT NULL,
	"ml" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "water_logs_user_id_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "weight_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"date" date NOT NULL,
	"weight_kg" numeric(5, 1) NOT NULL,
	CONSTRAINT "weight_logs_user_id_date_unique" UNIQUE("user_id","date")
);
--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_nutritionist_id_nutritionists_id_fk" FOREIGN KEY ("nutritionist_id") REFERENCES "public"."nutritionists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_tokens" ADD CONSTRAINT "email_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutri_profiles" ADD CONSTRAINT "nutri_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sleep_logs" ADD CONSTRAINT "sleep_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "step_logs" ADD CONSTRAINT "step_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "water_logs" ADD CONSTRAINT "water_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_consultations_user" ON "consultations" USING btree ("user_id","date","time");--> statement-breakpoint
CREATE INDEX "ix_email_tokens_lookup" ON "email_tokens" USING btree ("purpose","token_hash");--> statement-breakpoint
CREATE INDEX "ix_habit_logs_user" ON "habit_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "ix_meal_logs_user" ON "meal_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "ix_measurements_user" ON "measurements" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "ix_sleep_logs_user" ON "sleep_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "ix_step_logs_user" ON "step_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "ix_water_logs_user" ON "water_logs" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "ix_weight_logs_user" ON "weight_logs" USING btree ("user_id","date");