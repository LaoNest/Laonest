import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { createClient } from "../../../../lib/supabase/server";
import SubmitForReviewButton from "../../../../components/owner/SubmitForReviewButton";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-surface text-muted border border-border-soft",
  pending: "bg-warning/10 text-warning",
  active: "bg-success-light text-success-dark",
  rented: "bg-primary-light text-primary-dark",
  hidden: "bg-surface text-muted border border-border-soft",
  rejected: "bg-danger/10 text-danger",
};

export default async function MyPropertiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("listing");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: properties } = await supabase
    .from("properties")
    .select(
      "id, property_type, status, district, village, bedrooms, bathrooms, monthly_rent, currency, property_translations (language_code, title)"
    )
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

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
          <h1 className="text-2xl font-bold text-navy">
            {t("myPropertiesTitle")}
          </h1>
          <Link
            href={`/${locale}/owner/new-listing`}
            className="bg-primary hover:bg-primary-dark text-white font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            {t("newListing")}
          </Link>
        </div>

        {!properties || properties.length === 0 ? (
          <div className="bg-background rounded-2xl border border-border-soft p-10 text-center text-muted">
            {t("noProperties")}
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <div
                key={property.id}
                className="bg-background rounded-2xl border border-border-soft shadow-sm p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-navy">
                      {getTitle(property.property_translations)}
                    </h2>
                    <p className="text-sm text-muted">
                      {t(`types.${property.property_type}`)} ·{" "}
                      {property.district}
                      {property.village ? ` · ${property.village}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium ${
                      STATUS_STYLES[property.status] || STATUS_STYLES.draft
                    }`}
                  >
                    {t(`statuses.${property.status}`)}
                  </span>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-navy-soft">
                      🛏 {property.bedrooms} · 🛁 {property.bathrooms}
                    </p>
                    <Link
                      href={`/${locale}/owner/properties/${property.id}/photos`}
                      className="text-sm font-medium text-primary hover:text-primary-dark"
                    >
                      📷 {t("photos")}
                    </Link>
                  </div>
                  <p className="text-lg font-bold text-navy">
                    {formatRent(property.monthly_rent, property.currency)}
                    <span className="text-sm font-normal text-muted">
                      {t("perMonth")}
                    </span>
                  </p>
                </div>

                {property.status === "draft" && (
                  <div className="pt-2 border-t border-border-soft">
                    <SubmitForReviewButton propertyId={property.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
