-- Portfolio Maker: visitor forms go through the site's own server only.
-- Run after 0009_scale.sql, in the Supabase SQL editor, and only after the site version with the
-- spam check is live and SUPABASE_SECRET_KEY is set in Vercel (the forms use it from now on).
-- Safe to run again.
--
-- Until now visitors' browsers could call these functions directly with the public key, which
-- would skip the spam check (Cloudflare Turnstile) that /api/contact and /api/report do. Now only
-- the server key may call them. Counting visits stays open: it has no form to check.

revoke execute on function public.submit_contact_message(text, text, text, text) from public, anon, authenticated;
revoke execute on function public.submit_newsletter_signup(text, text) from public, anon, authenticated;
revoke execute on function public.submit_abuse_report(text, text, text, text) from public, anon, authenticated;

grant execute on function public.submit_contact_message(text, text, text, text) to service_role;
grant execute on function public.submit_newsletter_signup(text, text) to service_role;
grant execute on function public.submit_abuse_report(text, text, text, text) to service_role;
