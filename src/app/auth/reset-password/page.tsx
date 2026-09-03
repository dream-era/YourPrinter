import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  return <ResetPasswordForm requiresPin={!session} />;
}
