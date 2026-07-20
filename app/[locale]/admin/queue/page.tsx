import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "../../../../lib/supabase/server";
import ReviewActions from "../../../../components/admin/ReviewActions";

export default async function AdminQueuePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("admin");
  const tl = await getTranslations("listing");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Server-side admin check (RLS is the real gate; this protects the route)
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    redirect(`/${locale}`);
  }

  const { data: pending } = await supabase
    .from("properties")
    .select(
      "id, property_type, district, village, bedrooms, bathrooms, monthly_rent, currency, created_at, property_translations (language_code, title), profiles (full_name)"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  function getTitle(translations: { language_code: string; title: string }[]) {
    return (
      translations.find((tr) => tr.language_code === locale)?.title ||
      translations.find((tr) => tr.language_code === "en")?.title ||
      "—"
    );
  }

  function formatRent(amount: number, currency: string) {
    const formatted = new Intl.NumberFormat(
      locale === "lo" ? "lo-LA" : locale === "zh" ? "zh-CN" : "en-US"
    ).format(amount);
    return currency === "LAK" ? `${formatted} ₭` : `$${formatted}`;
  }

  return (
    <main className="min-h-screen bg-surface py-10 px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-navy">{t("queueTitle")}</h1>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-warning/10 text-warning">
            {pending?.length || 0}
          </span>
        </div>

        {!pending || pending.length === 0 ? (
          <div className="bg-background rounded-2xl border border-border-soft p-10 text-center text-muted">
            {t("noPending")}
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((property) => (
              <div
                key={property.id}
                className="bg-background rounded-2xl border border-border-soft shadow-sm p-6 space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-navy">
                    {getTitle(property.property_translations)}
                  </h2>
                  <p className="text-sm text-muted">
                    {tl(`types.${property.property_type}`)} ·{" "}
                    {property.district}
                    {property.village ? ` · ${property.village}` : ""} · 🛏{" "}
                    {property.bedrooms} · 🛁 {property.bathrooms}
                  </p>
                  <p className="text-sm text-muted">
                    {t("owner")}:{" "}
                    {(property.profiles as { full_name: string } | null)
                      ?.full_name || "—"}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-lg font-bold text-navy">
                    {formatRent(property.monthly_rent, property.currency)}
                    <span className="text-sm font-normal text-muted">
                      {tl("perMonth")}
                    </span>
                  </p>
                  <ReviewActions propertyId={property.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
