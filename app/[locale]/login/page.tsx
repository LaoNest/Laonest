"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(t("genericError"));
    } else {
      router.push(`/${locale}/welcome`);
    }
  }

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-background rounded-2xl border border-border-soft shadow-sm p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-navy">{t("loginTitle")}</h1>
          <p className="text-muted text-sm">LaoNest</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-navy-soft">{t("email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border-soft px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-navy-soft">{t("password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border-soft px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {loading ? "..." : t("loginButton")}
          </button>

          {message && <p className="text-sm text-danger">{message}</p>}
        </div>
      </div>
    </main>
  );
}