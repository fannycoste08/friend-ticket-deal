import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/**
 * Fetches an email template from the database and replaces {{variables}} with actual values.
 * Falls back to null if the template is not found.
 */
export async function getEmailTemplate(
  templateKey: string,
  variables: Record<string, string>
): Promise<{ subject: string; html: string } | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from("email_templates")
    .select("subject, html_content")
    .eq("template_key", templateKey)
    .maybeSingle();

  if (error || !data) {
    console.warn(`Template "${templateKey}" not found in DB, using fallback`);
    return null;
  }

  let subject = data.subject;
  let html = data.html_content;

  // Replace all {{variable}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    subject = subject.replace(pattern, value);
    html = html.replace(pattern, value);
  }

  return { subject, html };
}
