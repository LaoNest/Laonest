"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "../../../../lib/supabase/client";

const PROPERTY_TYPES = [
  "apartment", "flat", "house", "villa", "studio",
  "room", "office", "shophouse", "commercial", "warehouse",
] as const;

const DISTRICTS = [
  "Chanthabouly", "Sisattanak", "Xaysetha", "Sikhottabong",
  "Hadxaifong", "Xaythany", "Naxaithong", "Sangthong", "Parkngum",
];

export default function NewListingPage() {
  const t = useTranslations("listing");
  const tc = useTranslations("common");

  const [propertyType, setPropertyType] = useState("apartment");
  const [district, setDistrict] = useState("Chanthabouly");
  const [village, setVillage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bedrooms, setBedrooms] = useState("1");
  const [bathrooms, setBathrooms] = useState("1");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [deposit, setDeposit] = useState("");
  const [currency, setCurrency] = useState("LAK");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    setMessage("");

    if (!title.trim() || !monthlyRent || parseFloat(monthlyRent) <= 0) {
      setLoading(false);
      setMessage("Please enter a title and monthly rent.");
      return;
    }

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setMessage("Please log in first.");
      return;
    }

    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        owner_id: user.id,
        property_type: propertyType,
        district,
        village: village || null,
        bedrooms: parseInt(bedrooms) || 0,
        bathrooms: parseInt(bathrooms) || 0,
        monthly_rent: parseFloat(monthlyRent) || 0,
        deposit_amount: parseFloat(deposit) || 0,
        currency,
      })
      .select()
      .single();

    if (error || !property) {
      setLoading(false);
      setMessage(error?.message || "Error");
      return;
    }

    const { error: translationError } = await supabase
      .from("property_translations")
      .insert({
        property_id: property.id,
        language_code: "en",
        title,
        description,
      });

    setLoading(false);
    setMessage(translationError ? translationError.message : t("saved"));
  }

  const inputClass =
    "w-full rounded-xl border border-border-soft px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary bg-background";
  const labelClass = "text-sm font-medium text-navy-soft";

  return (
    <main className="min-h-screen bg-surface py-10 px-6">
      <div className="max-w-2xl mx-auto bg-background rounded-2xl border border-border-soft shadow-sm p-8 space-y-6">
        <h1 className="text-2xl font-bold text-navy">{t("createTitle")}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelClass}>{t("propertyType")}</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className={inputClass}
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`types.${type}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className={labelClass}>{t("district")}</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={inputClass}
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className={labelClass}>{t("village")}</label>
          <input
            type="text"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>{t("title")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label className={labelClass}>{t("description")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelClass}>{t("bedrooms")}</label>
            <input
              type="number"
              min="0"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>{t("bathrooms")}</label>
            <input
              type="number"
              min="0"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className={labelClass}>{t("monthlyRent")}</label>
            <input
              type="number"
              min="0"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>{t("deposit")}</label>
            <input
              type="number"
              min="0"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>{t("currency")}</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className={inputClass}
            >
              <option value="LAK">LAK ₭</option>
              <option value="USD">USD $</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
        >
          {loading ? "..." : t("saveDraft")}
        </button>

        {message && <p className="text-sm text-navy-soft">{message}</p>}
      </div>
    </main>
  );
}