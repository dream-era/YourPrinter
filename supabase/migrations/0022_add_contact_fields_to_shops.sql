-- Add contact_email and contact_phone to shops table
alter table "public"."shops" add column if not exists "contact_email" text;
alter table "public"."shops" add column if not exists "contact_phone" text;
