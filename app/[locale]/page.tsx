import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations();

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-background rounded-2xl border border-border-soft shadow-sm p-8 space-y-6">

        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-navy">{t("common.appName")}</h1>
          <p className="text-muted">{t("common.slogan")}</p>
        </div>

        <p className="text-navy-soft">{t("home.welcome")}</p>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-success-light text-success-dark">
            ✓ Verified Owner
          </span>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-light text-primary-dark">
            ✓ Verified Property
          </span>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-xl transition-colors">
            Book Viewing
          </button>
          <button className="flex-1 bg-success hover:bg-success-dark text-white font-medium py-3 rounded-xl transition-colors">
            Chat Owner
          </button>
        </div>
      </div>
    </main>
  );
}