-- 0017_shop_contact_info.sql
-- Adds contact_email and contact_phone to shops for public-facing or admin communications
-- distinct from the shop owner's personal profile email/phone.

alter table public.shops 
add column contact_email text,
add column contact_phone text;
