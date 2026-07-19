import { redirect } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";

export default async function WelcomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, preferred_language")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-background rounded-2xl border border-border-soft shadow-sm p-8 space-y-4">
        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-success-light text-success-dark">
          ✓ Logged in
        </span>
        <h1 className="text-2xl font-bold text-navy">
          Welcome, {profile?.full_name || user.email}
        </h1>
        <p className="text-muted text-sm">
          Session active · Profile loaded from database via RLS
        </p>
      </div>
    </main>
  );
}