"use client";

import React from "react";
import type { Confidence } from "@/lib/types";
import { useI18n } from "@/components/i18n-provider";
import { localizeDisplay } from "@/lib/display-localization";

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const { locale } = useI18n();
  const content =
    confidence === "verified"
      ? { class: "verified", text: "Проверено вузом", icon: "✓" }
      : confidence === "previous-year"
      ? { class: "previous", text: "Тариф 2025/26", icon: "⏱" }
      : { class: "demo", text: "Демо-оценка", icon: "ℹ" };

  return (
    <span className={`confidence ${content.class}`} title={localizeDisplay("Статус верификации данных", locale)}>
      <i aria-hidden="true">{content.icon}</i>
      <span>{localizeDisplay(content.text, locale)}</span>
    </span>
  );
}

export function CategoryBadge({ category }: { category: "target" | "reach" | "safety" }) {
  const { locale } = useI18n();
  const meta = {
    target: { class: "cat-target", label: "Целевой (Target)", tip: "Высокие шансы при планомерной подготовке" },
    reach: { class: "cat-reach", label: "Амбициозный (Reach)", tip: "Высокая конкуренция, требуется максимальный балл" },
    safety: { class: "cat-safety", label: "Надёжный (Safety)", tip: "Баллы и бюджет полностью соответствуют требованиям" },
  }[category];

  return (
    <span className={`category-badge ${meta.class}`} title={localizeDisplay(meta.tip, locale)}>
      {localizeDisplay(meta.label, locale)}
    </span>
  );
}
