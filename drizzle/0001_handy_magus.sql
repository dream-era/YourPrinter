CREATE TABLE "areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "areas_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"state" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "colleges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city_id" uuid NOT NULL,
	"area_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"campus_landmark" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "colleges_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "shop_payment_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"merchant_name" text NOT NULL,
	"razorpay_key_id" text NOT NULL,
	"razorpay_key_secret_encrypted" text NOT NULL,
	"webhook_secret_encrypted" text,
	"support_email" text NOT NULL,
	"support_phone" text NOT NULL,
	"payments_enabled" boolean DEFAULT true NOT NULL,
	"sandbox_mode" boolean DEFAULT false NOT NULL,
	"verification_status" text DEFAULT 'pending' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_payment_settings_shop_id_unique" UNIQUE("shop_id")
);
--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "city_id" uuid;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "area_id" uuid;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "college_id" uuid;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "cover_images" jsonb;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "services" jsonb;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "auto_print_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "colleges" ADD CONSTRAINT "colleges_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_payment_settings" ADD CONSTRAINT "shop_payment_settings_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_areas_city" ON "areas" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "idx_areas_slug" ON "areas" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_cities_slug" ON "cities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_cities_active" ON "cities" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_colleges_city" ON "colleges" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "idx_colleges_area" ON "colleges" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "idx_colleges_slug" ON "colleges" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_shop_payments_shop_id" ON "shop_payment_settings" USING btree ("shop_id");--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_college_id_colleges_id_fk" FOREIGN KEY ("college_id") REFERENCES "public"."colleges"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_shops_city_id" ON "shops" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "idx_shops_area_id" ON "shops" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "idx_shops_college_id" ON "shops" USING btree ("college_id");