"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "../../lib/supabase/client";

export default function SubmitForReviewButton({
  propertyId,
}: {
  propertyId: string;
}) {
  const t = useTranslations("listing");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("properties")
      .update({ status: "pending" })
      .eq("id", propertyId);

    setLoading(false);

    if (!error) {
      router.refresh();
    }
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={loading}
      className="text-sm font-medium text-white bg-primary hover:bg-primary-dark disabled:opacity-50 px-4 py-2 rounded-xl transition-colors"
    >
      {loading ? "..." : t("submitForReview")}
    </button>
  );
}
