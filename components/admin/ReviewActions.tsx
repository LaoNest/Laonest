"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "../../lib/supabase/client";

export default function ReviewActions({
  propertyId,
}: {
  propertyId: string;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logAction(action: string, reason: string | null) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action,
      target_type: "property",
      target_id: propertyId,
      reason,
    });
  }

  async function handleApprove() {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("properties")
      .update({ status: "active", is_verified: true })
      .eq("id", propertyId);

    if (!error) {
      await logAction("approve_listing", null);
      router.refresh();
    }
    setLoading(false);
  }

  async function handleReject() {
    const reason = window.prompt(t("rejectReason"));
    if (reason === null) return; // admin cancelled the prompt

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("properties")
      .update({ status: "rejected" })
      .eq("id", propertyId);

    if (!error) {
      await logAction("reject_listing", reason || "(no reason given)");
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleApprove}
        disabled={loading}
        className="text-sm font-medium text-white bg-success hover:bg-success-dark disabled:opacity-50 px-4 py-2 rounded-xl transition-colors"
      >
        {loading ? "..." : t("approve")}
      </button>
      <button
        onClick={handleReject}
        disabled={loading}
        className="text-sm font-medium text-white bg-danger hover:opacity-90 disabled:opacity-50 px-4 py-2 rounded-xl transition-colors"
      >
        {t("reject")}
      </button>
    </div>
  );
}
