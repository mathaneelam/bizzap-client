-- Admin email notification for new dashboard access requests.
--
-- When a new user signs in, the dashboard inserts a `pending` row into
-- staff_access (see dashboard/src/hooks/useAuth.ts). This trigger fires on that
-- insert and emails the admin via Resend, using pg_net for async (non-blocking)
-- HTTP so a mail failure never blocks sign-in.
--
-- No Edge Function required — the trigger calls the Resend API directly.
--
-- SETUP: replace __RESEND_API_KEY__ below with your Resend API key (re_...),
-- then run this file against the database (Supabase SQL editor, or
-- `psql "$SUPABASE_DB_URL" -f pipeline/notify_access_request.sql`).
-- Requires the staff_access table (pipeline/schema.sql) to exist first.
--
-- NOTE: this is already installed on the live database. Keep the real key OUT of
-- git — only the placeholder belongs here. To rotate, re-run with a new key.

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_access_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  who  text;
  html text;
BEGIN
  IF new.status = 'pending' THEN
    who := coalesce(new.name, new.email);
    html := '<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:28px;background:#1a1a1a;color:#ececec;border-radius:14px;">'
         || '<div style="font-family:Georgia,serif;font-size:22px;margin-bottom:16px;">Bizzap<span style="color:#c96442;">.</span></div>'
         || '<div style="font-size:30px;">&#128276;</div>'
         || '<h2 style="font-family:Georgia,serif;margin:6px 0;">New dashboard access request</h2>'
         || '<p style="color:#8e8ea0;">A new user signed in and is waiting for your approval.</p>'
         || '<p><b>Name:</b> ' || who || '<br><b>Email:</b> ' || new.email || '</p>'
         || '<a href="https://bizzap-dashboard.pages.dev" style="display:inline-block;margin-top:12px;background:#c96442;color:#faf9f5;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600;">Review in Staff tab &#8594;</a>'
         || '</div>';
    PERFORM net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object(
        'Authorization', 'Bearer __RESEND_API_KEY__',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'from', 'Bizzap <onboarding@resend.dev>',
        'to', jsonb_build_array('mathaneelam@gmail.com'),
        'subject', '🔔 New Bizzap access request - ' || new.email,
        'html', html
      )
    );
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_access_request ON public.staff_access;
CREATE TRIGGER trg_notify_access_request
  AFTER INSERT ON public.staff_access
  FOR EACH ROW EXECUTE FUNCTION public.notify_access_request();
